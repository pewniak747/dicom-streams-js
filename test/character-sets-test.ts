import assert from "assert";
import {CharacterSets} from "../src/character-sets";
import {VR} from "../src/vr";

describe("Parsing a DICOM file", () => {

    it("should parse an Arab name correctly", () => {
        const expectedName = "قباني^لنزار";
        const nameBytes = Buffer.from([0xE2, 0xC8, 0xC7, 0xE6, 0xEA, 0x5E, 0xE4, 0xE6, 0xD2, 0xC7, 0xD1]);
        const cs = CharacterSets.fromNames("ISO_IR 127");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a French name correctly", () => {
        const expectedName = "Buc^Jérôme";
        const nameBytes = Buffer.from([0x42, 0x75, 0x63, 0x5E, 0x4A, 0xE9, 0x72, 0xF4, 0x6D, 0x65]);
        const cs = CharacterSets.fromNames("ISO_IR 100");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a German name correctly", () => {
        const expectedName = "Äneas^Rüdiger";
        const nameBytes = Buffer.from([0xC4, 0x6E, 0x65, 0x61, 0x73, 0x5E, 0x52, 0xFC, 0x64, 0x69, 0x67, 0x65, 0x72]);
        const cs = CharacterSets.fromNames("ISO_IR 100");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Greek name correctly", () => {
        const expectedName = "Διονυσιος";
        const nameBytes = Buffer.from([0xC4, 0xE9, 0xEF, 0xED, 0xF5, 0xF3, 0xE9, 0xEF, 0xF2]);
        const cs = CharacterSets.fromNames("ISO_IR 126");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Japanese name correctly (1)", () => {
        const expectedName = "Yamada^Tarou=山田^太郎=やまだ^たろう";
        const nameBytes = Buffer.from([0x59, 0x61, 0x6D, 0x61, 0x64, 0x61, 0x5E, 0x54, 0x61, 0x72, 0x6F, 0x75, 0x3D,
            0x1B, 0x24, 0x42, 0x3B, 0x33, 0x45, 0x44, 0x1B, 0x28, 0x42, 0x5E, 0x1B, 0x24, 0x42, 0x42, 0x40, 0x4F, 0x3A,
            0x1B, 0x28, 0x42, 0x3D, 0x1B, 0x24, 0x42, 0x24, 0x64, 0x24, 0x5E, 0x24, 0x40, 0x1B, 0x28, 0x42, 0x5E, 0x1B,
            0x24, 0x42, 0x24, 0x3F, 0x24, 0x6D, 0x24, 0x26, 0x1B, 0x28, 0x42]);
        const cs = CharacterSets.fromNames("\\ISO 2022 IR 87");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Japanese name correctly (2)", () => {
        const expectedName = "ﾔﾏﾀﾞ^ﾀﾛｳ=山田^太郎=やまだ^たろう";
        const nameBytes = Buffer.from([0xD4, 0xCF, 0xC0, 0xDE, 0x5E, 0xC0, 0xDB, 0xB3, 0x3D, 0x1B, 0x24, 0x42, 0x3B,
            0x33, 0x45, 0x44, 0x1B, 0x28, 0x4A, 0x5E, 0x1B, 0x24, 0x42, 0x42, 0x40, 0x4F, 0x3A, 0x1B, 0x28, 0x4A, 0x3D,
            0x1B, 0x24, 0x42, 0x24, 0x64, 0x24, 0x5E, 0x24, 0x40, 0x1B, 0x28, 0x4A, 0x5E, 0x1B, 0x24, 0x42, 0x24, 0x3F,
            0x24, 0x6D, 0x24, 0x26, 0x1B, 0x28, 0x4A]);
        const cs = CharacterSets.fromNames("ISO 2022 IR 13\\ISO 2022 IR 87");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Japanese name correctly (3)", () => {
        const expectedName = "ﾔﾏﾀﾞ^ﾀﾛｳ";
        const nameBytes = Buffer.from([0xD4, 0xCF, 0xC0, 0xDE, 0x5E, 0xC0, 0xDB, 0xB3]);
        const cs = CharacterSets.fromNames("ISO_IR 13");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Hebrew name correctly", () => {
        const expectedName = "שרון^דבורה";
        const nameBytes = Buffer.from([0xF9, 0xF8, 0xE5, 0xEF, 0x5E, 0xE3, 0xE1, 0xE5, 0xF8, 0xE4]);
        const cs = CharacterSets.fromNames("ISO_IR 138");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Korean name correctly", () => {
        const expectedName = "Hong^Gildong=洪^吉洞=홍^길동";
        const nameBytes = Buffer.from([0x48, 0x6F, 0x6E, 0x67, 0x5E, 0x47, 0x69, 0x6C, 0x64, 0x6F, 0x6E, 0x67, 0x3D,
            0x1B, 0x24, 0x29, 0x43, 0xFB, 0xF3, 0x5E, 0x1B, 0x24, 0x29, 0x43, 0xD1, 0xCE, 0xD4, 0xD7, 0x3D, 0x1B,
            0x24, 0x29, 0x43, 0xC8, 0xAB, 0x5E, 0x1B, 0x24, 0x29, 0x43, 0xB1, 0xE6, 0xB5, 0xBF]);
        const cs = CharacterSets.fromNames("\\ISO 2022 IR 149");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Russian name correctly", () => {
        const expectedName = "Люкceмбypг";
        const nameBytes = Buffer.from([0xBB, 0xEE, 0xDA, 0x63, 0x65, 0xDC, 0xD1, 0x79, 0x70, 0xD3]);
        const cs = CharacterSets.fromNames("ISO_IR 144");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Chinese name correctly (1)", () => {
        const expectedName = "Wang^XiaoDong=王^小東=";
        const nameBytes = Buffer.from([0x57, 0x61, 0x6E, 0x67, 0x5E, 0x58, 0x69, 0x61, 0x6F, 0x44, 0x6F, 0x6E, 0x67,
            0x3D, 0xE7, 0x8E, 0x8B, 0x5E, 0xE5, 0xB0, 0x8F, 0xE6, 0x9D, 0xB1, 0x3D]);
        const cs = CharacterSets.fromNames("ISO_IR 192");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

    it("should parse a Chinese name correctly (2)", () => {
        const expectedName = "Wang^XiaoDong=王^小东=";
        const nameBytes = Buffer.from([0x57, 0x61, 0x6E, 0x67, 0x5E, 0x58, 0x69, 0x61, 0x6F, 0x44, 0x6F, 0x6E, 0x67,
            0x3D, 0xCD, 0xF5, 0x5E, 0xD0, 0xA1, 0xB6, 0xAB, 0x3D]);
        const cs = CharacterSets.fromNames("GB18030");
        const name = cs.decode(nameBytes, VR.PN);
        assert.strictEqual(name, expectedName);
    });

});
