/**
 * Base OSR2 Configuration
 *
 * TODO: Add auxiliary axes.
 */
const OSR2 = {
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
      type: 'boolean',
    },
  ],
};

/**
 * Base SR6 Configuration
 *
 * SR6 configuration is just the OSR2 configuration plus a couple axes.
 */
const SR6 = JSON.parse(JSON.stringify(OSR2));
SR6.name = 'SR6';
SR6.axes.push({
  name: 'L1',
  type: 'linear',
  alias: 'forward',
}, {
  name: 'L2',
  type: 'linear',
  alias: 'left',
});

export { OSR2, SR6 };
