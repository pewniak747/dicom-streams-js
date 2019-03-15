const {Transform} = require("readable-stream");
const zlib = require("zlib");
const pipe = require("multipipe");
const base = require("./base");
const UID = require("./uid");
const {Detour} = require("./detour");
const {
    HeaderPart, ValueChunk, SequencePart, SequenceDelimitationPart, ItemPart, ItemDelimitationPart, DeflatedChunk
} = require("./parts");
const {emptyTagPath} = require("./tag-path");
const {
    IdentityFlow, DeferToPartFlow, InFragments, GuaranteedValueEvent, GuaranteedDelimitationEvents, TagPathTracking,
    GroupLengthWarnings, create
} = require("./dicom-flow");

const toBytesFlow = function () {
    return new Transform({
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
            this.push(chunk.bytes);
            process.nextTick(() => callback());
        }
    });
};

const whitelistFilter = function (whitelist) {
    return tagFilter(currentPath => whitelist.some(t => t.hasTrunk(currentPath) || t.isTrunkOf(currentPath)), () => false);
};

const blacklistFilter = function (blacklist) {
    return tagFilter(currentPath => !blacklist.some(t => t.isTrunkOf(currentPath)));
};

const groupLengthDiscardFilter = function () {
    return tagFilter(tagPath => !base.isGroupLength(tagPath.tag()) || base.isFileMetaInformation(tagPath.tag()));
};

const fmiDiscardFilter = function () {
    return tagFilter(tagPath => !base.isFileMetaInformation(tagPath.tag()), () => false);
};

const tagFilter = function (keepCondition, defaultCondition, logGroupLengthWarnings) {
    let warnings = logGroupLengthWarnings === undefined ? false : logGroupLengthWarnings;
    let defCond = defaultCondition === undefined ? () => true : defaultCondition;
    return create(new class extends TagPathTracking(GuaranteedDelimitationEvents(GuaranteedValueEvent(GroupLengthWarnings(InFragments(DeferToPartFlow))))) {
        constructor() {
            super();
            this.silent = !warnings;
            this.keeping = false;
        }

        onPart(part) {
            this.keeping = this.tagPath === emptyTagPath ? defCond(part) : keepCondition(this.tagPath);
            return this.keeping ? [part] : [];
        }
    });
};

const headerFilter = function (keepCondition, logGroupLengthWarnings) {
    let warnings = logGroupLengthWarnings === undefined ? false : logGroupLengthWarnings;
    return create(new class extends GroupLengthWarnings(InFragments(DeferToPartFlow)) {
        constructor() {
            super();
            this.silent = !warnings;
            this.keeping = true;
        }

        onPart(part) {
            if (part instanceof HeaderPart) {
                this.keeping = keepCondition(part);
                return this.keeping ? [part] : [];
            }
            if (part instanceof ValueChunk)
                return this.keeping ? [part] : [];
            this.keeping = true;
            return [part];
        }
    });
};

const toIndeterminateLengthSequences = function () {
    return create(new class extends GuaranteedDelimitationEvents(InFragments(IdentityFlow)) {
        constructor() {
            super();
            this.indeterminateBytes = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
        }

        onSequence(part) {
            return super.onSequence(part).map(p => {
                if (p instanceof SequencePart && !p.indeterminate) {
                    return new SequencePart(
                        part.tag,
                        base.indeterminateLength,
                        part.bigEndian,
                        part.explicitVR,
                        base.concat(part.bytes.slice(0, part.bytes.length - 4), this.indeterminateBytes));
                }
                return p;
            });
        }

        onSequenceDelimitation(part) {
            let out = super.onSequenceDelimitation(part);
            if (part.bytes.length <= 0)
                out.push(new SequenceDelimitationPart(part.bigEndian, base.sequenceDelimitation(part.bigEndian)));
            return out;
        }

        onItem(part) {
            return super.onItem(part).map(p => {
                if (p instanceof ItemPart && !this.inFragments && !p.indeterminate) {
                    return new ItemPart(
                        part.index,
                        base.indeterminateLength,
                        part.bigEndian,
                        base.concat(part.bytes.slice(0, part.bytes.length - 4), this.indeterminateBytes));
                }
                return p;
            });
        }

        onItemDelimitation(part) {
            let out = super.onItemDelimitation(part);
            if (part.bytes.length <= 0)
                out.push(new ItemDelimitationPart(part.index, part.bigEndian, base.itemDelimitation(part.bigEndian)));
            return out;
        }
    });
};

class DeflateDatasetFlow extends Detour {
    constructor() {
        super({objectMode: true});
        this.collectingTs = false;
        this.tsBytes = base.emptyBuffer;
    }

    process(part) {
        if (part instanceof HeaderPart) {
            if (part.isFmi) {
                this.collectingTs = part.tag === Tag.TransferSyntaxUID;
                this.push(part);
            } else {
                if (this.tsBytes.toString().trim() === UID.DeflatedExplicitVRLittleEndian) {
                    let toDeflatedChunk = new Transform({
                        readableObjectMode: true,
                        transform(chunk, encoding, cb) {
                            this.push(new DeflatedChunk(false, chunk));
                            process.nextTick(() => cb());
                        }
                    });
                    this.setDetourFlow(pipe(toBytesFlow(), zlib.createDeflateRaw(), toDeflatedChunk));
                    this.setDetour(true, part);
                } else
                    this.push(part);
            }
        } else if (part instanceof ValueChunk && this.collectingTs) {
            this.tsBytes = base.concat(this.tsBytes, part.bytes);
            this.push(part);
        } else
            this.push(part);
    }
}

const deflateDatasetFlow = function () {
    return new DeflateDatasetFlow();
};

module.exports = {
    toBytesFlow: toBytesFlow,
    tagFilter: tagFilter,
    whitelistFilter: whitelistFilter,
    blacklistFilter: blacklistFilter,
    headerFilter: headerFilter,
    groupLengthDiscardFilter: groupLengthDiscardFilter,
    fmiDiscardFilter: fmiDiscardFilter,
    toIndeterminateLengthSequences: toIndeterminateLengthSequences,
    deflateDatasetFlow: deflateDatasetFlow
};
