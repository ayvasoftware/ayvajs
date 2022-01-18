/**
 * Base OSR2 Configuration
 */
const OSR2_CONFIG = {
  name: 'OSR2',
  defaultAxis: 'L0',
  axes: [
    {
      name: 'L0',
      type: 'linear',
      alias: 'stroke',
    },
    {
      name: 'R0',
      type: 'rotation',
      alias: 'twist',
    },
    {
      name: 'R1',
      type: 'rotation',
      alias: 'roll',
    },
    {
      name: 'R2',
      type: 'rotation',
      alias: 'pitch',
    },
    {
      name: 'A0',
      alias: 'valve',
      type: 'auxiliary',
    },
    {
      name: 'A1',
      alias: 'suck',
      type: 'auxiliary',
    },
    {
      name: 'A2',
      alias: 'lube',
      type: 'auxiliary',
    },
    {
      name: 'V0',
      type: 'auxiliary',
    },
    {
      name: 'V1',
      type: 'auxiliary',
    },
  ],
};

/**
 * Base SR6 Configuration
 *
 * SR6 configuration is just the OSR2 configuration plus a couple axes.
 */
const SR6_CONFIG = JSON.parse(JSON.stringify(OSR2_CONFIG));
SR6_CONFIG.name = 'SR6';
SR6_CONFIG.axes.push({
  name: 'L1',
  type: 'linear',
  alias: 'forward',
}, {
  name: 'L2',
  type: 'linear',
  alias: 'left',
});

export { OSR2_CONFIG, SR6_CONFIG };
