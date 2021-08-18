import I3ConfigFileParser from '../I3ConfigFileParser';
import { SPECFILE_PATH } from '../../index';

describe('i3 Config Parser', () => {
  describe('parser spec', () => {
    it('loads the parser constants from the spec file', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      // console = rawConsole;
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/i3config');
    });
  });

  describe('bindings', () => {
    it('parses basic keybindings', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/binding.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(5);
      expect(parser.configuration?.items[0].itemName).toBe('CFG_BINDING');
      expect(parser.configuration?.items[0].itemValue).toBe('exec autorandr -c');
      expect(parser.configuration?.items[0].itemArguments.bindtype).toBe('bindsym');
    });
  });

  describe('colors', () => {
    it('parses basic colors', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/colors.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(6);
    });
  });

  describe('exec', () => {
    it('parses exec statements', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/exec.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(5);
    });
  });

  describe('for_window', () => {
    it('parses for_window statements', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/for_window.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(7);
    });
  });

  describe('mode', () => {
    it('parses mode blocks', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/mode.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(11);
    });
  });

  describe('bar', () => {
    it('parses bar blocks', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/bar.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(6);
    });
  });

  describe('variables', () => {
    it('properly substitutes variables', async () => {
      const parser = new I3ConfigFileParser();
      await parser.loadConfigSpecFromFile(SPECFILE_PATH);
      await parser.parseConfigFromFile('./test/fixtures/variables.i3config');

      expect(parser.configuration).not.toBeUndefined();
      expect(parser.configuration?.items).toHaveLength(1);
    });
  });
});
