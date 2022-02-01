/* eslint-disable object-curly-newline */

export default [
  {
    name: 'down-forward',
    L0: { from: 0.0, to: 1.0, phase: 0, ecc: 0.5 },
    L1: { from: 0.8, to: 0.2, phase: 1, ecc: 0.8 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.2, to: 0.8, phase: 1, ecc: 0.8 },
  },

  {
    name: 'down-backward',
    L0: { from: 0.0, to: 1.0, phase: 0, ecc: 0.5 },
    L1: { from: 0.2, to: 0.8, phase: 1, ecc: 0.8 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.8, to: 0.2, phase: 1, ecc: 0.8 },
  },

  {
    name: 'back-thrust-down',
    L0: { from: 0.0, to: 0.7, phase: 0, ecc: 0.5 },
    L1: { from: 1.0, to: 0.0, phase: 0, ecc: 0.5 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.4, to: 1.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'back-thrust-down-swirl',
    L0: { from: 0.0, to: 0.7, phase: 0, ecc: 0.5 },
    L1: { from: 0.9, to: 0.1, phase: 0, ecc: 0.5 },
    L2: { from: 0.8, to: 0.2, phase: 1, ecc: 0.5 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.8, to: 0.2, phase: 1, ecc: 0.5 },
    R2: { from: 0.5, to: 1.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'thrust-forward',
    L0: { from: 0.0, to: 0.5, phase: 0, ecc: 0.5 },
    L1: { from: 0.2, to: 1.0, phase: 0, ecc: 0.5 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.5, to: 1.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'thrust-forward-swirl',
    L0: { from: 0.0, to: 0.5, phase: 0, ecc: 0.5 },
    L1: { from: 0.2, to: 1.0, phase: 0, ecc: 0.5 },
    L2: { from: 0.8, to: 0.2, phase: 1, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.8, to: 0.2, phase: 1, ecc: 0.0 },
    R2: { from: 0.5, to: 1.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'lean-forward-thrust-down',
    L0: { from: 0.0, to: 0.7, phase: 0, ecc: 0.5 },
    L1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 1.0, to: 0.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'lean-forward-thrust-down-swirl',
    L0: { from: 0.0, to: 0.7, phase: 0, ecc: 0.5 },
    L1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    L2: { from: 0.8, to: 0.2, phase: 1, ecc: 0.5 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.8, to: 0.2, phase: 1, ecc: 0.5 },
    R2: { from: 1.0, to: 0.0, phase: 0, ecc: 0.5 },
  },

  {
    name: 'diagonal-down-back',
    L0: { from: 0.0, to: 0.5, phase: 0, ecc: 0.2 },
    L1: { from: 1.0, to: 0.2, phase: 0, ecc: 0.2 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 1.0, to: 0.0, phase: 1, ecc: 0.6 },
  },

  {
    name: 'diagonal-down-forward',
    L0: { from: 0.0, to: 0.5, phase: 0, ecc: 0.2 },
    L1: { from: 0.0, to: 0.8, phase: 0, ecc: 0.2 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.0, to: 1.0, phase: 1, ecc: 0.6 },
  },

  {
    name: 'orbit-tease',
    L0: { from: 0.8, to: 1.0, phase: 0, ecc: 0.3 },
    L1: { from: 0.9, to: 0.1, phase: 0, ecc: -0.3 },
    L2: { from: 0.1, to: 0.9, phase: 1, ecc: -0.3 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.1, to: 0.9, phase: 1, ecc: -0.3 },
    R2: { from: 0.1, to: 0.9, phase: 0, ecc: -0.3 },
  },

  {
    name: 'left-right-tease',
    L0: { from: 0.9, to: 0.9, phase: 0, ecc: 0.0 },
    L1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    L2: { from: 0.0, to: 1.0, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 1.0, to: 0.0, phase: 1, ecc: 0.0 },
    R2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
  },

  {
    name: 'forward-back-tease',
    L0: { from: 0.9, to: 0.9, phase: 0, ecc: 0.0 },
    L1: { from: 0.0, to: 1.0, phase: 0, ecc: 0.0 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.0, to: 1.0, phase: 1, ecc: 0.0 },
  },

  {
    name: 'vortex-tease',
    L0: { from: 0.8, to: 1.0, phase: 0, ecc: 0.3 },
    L1: { from: 0.6, to: 0.4, phase: 0, ecc: 0.0 },
    L2: { from: 0.4, to: 0.6, phase: 1, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.9, to: 0.1, phase: 1, ecc: 0.0 },
    R2: { from: 0.9, to: 0.1, phase: 0, ecc: 0.0 },
  },

  {
    name: 'swirl-tease',
    L0: { from: 0.5, to: 1.0, phase: 0, ecc: 0.0 },
    L1: { from: 1.0, to: 0.3, phase: 0, ecc: 0.0 },
    L2: { from: 1.0, to: 0.0, phase: 1, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.9, to: 0.1, phase: 1, ecc: 0.0 },
    R2: { from: 0.4, to: 1.0, phase: 0, ecc: 0.0 },
  },

  {
    name: 'forward-back-grind',
    L0: { from: 0.0, to: 0.0, phase: 0, ecc: 0.0 },
    L1: { from: 0.3, to: 0.7, phase: 0, ecc: 0.0 },
    L2: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R2: { from: 0.0, to: 1.0, phase: 0.5, ecc: 0.0 },
  },

  {
    name: 'orbit-grind',
    L0: { from: 0.0, to: 0.3, phase: 0, ecc: 0.3 },
    L1: { from: 0.0, to: 0.6, phase: 0, ecc: -0.3 },
    L2: { from: 0.2, to: 0.8, phase: 1, ecc: -0.3 },
    R0: { from: 0.5, to: 0.5, phase: 0, ecc: 0.0 },
    R1: { from: 0.1, to: 0.9, phase: 1, ecc: -0.3 },
    R2: { from: 0.9, to: 0.1, phase: 0, ecc: -0.3 },
  },
].reduce((result, mode) => {
  const { name } = mode;
  delete mode.name;

  result[name] = mode;
  return result;
}, {});
