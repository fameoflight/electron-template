import React from 'react';

import _ from 'lodash';

import { Transition, motion as framermotion } from 'framer-motion';

interface IMotionShiftProps {
  motionKey?: string | number;
  children: React.ReactNode;
  values?: {
    x?: number | string;
    y?: number | string;
  };
  transition?: Transition;
}

function MotionShift(props: IMotionShiftProps) {
  const x = props.values?.x || 0;
  const y = props.values?.y || 0;

  const negativeX = _.isNumber(x) ? -x : x;
  const negativeY = _.isNumber(y) ? -y : y;

  const transition = props.transition || { duration: 0.3 };

  return (
    <framermotion.div
      key={props.motionKey}
      initial={{ x: x, y: y, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={{ x: negativeX, y: negativeY, opacity: 0 }}
      transition={transition}
    >
      {props.children}
    </framermotion.div>
  );
}

const Motion = {
  shift: MotionShift,
};

export default Motion;
