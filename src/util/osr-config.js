/**
 * Base OSR Configuration for a six axes device.
 */
export default {
  name: 'SR6',
  defaultAxis: 'L0',
  axes: [
    {
      name: 'L0',
      type: 'linear',
      alias: 'stroke',
    },
    {
      name: 'L1',
      type: 'linear',
      alias: 'forward',
    }, {
      name: 'L2',
      type: 'linear',
      alias: 'left',
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
