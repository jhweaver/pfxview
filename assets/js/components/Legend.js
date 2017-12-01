import React from 'react';
import './Legend.scss';

// eslint-disable-next-line arrow-body-style
const Legend = () => {
  return (
    <div>
      <div className="centered padded">
        <span className="red">Fastball</span>
        <span className="green">Silder</span>
        <span className="blue">Curve</span>
        <span className="teal">Change</span>
        <span className="tan">Other</span>
      </div>
      <div className="centered padded">
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>square</title>
            <rect width={20} height={20} />
          </svg>
          <span className="description">
            - Ball
          </span>
        </span>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>circle</title>
            <circle cx={10} cy={10} r={10} />
          </svg>
          <span className="description">
            - Called Strike
          </span>
        </span>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>triangle</title>
            <polygon points="0,20 10,0 20,20 0,20" />
          </svg>
          <span className="description">
            - Swinging Strike
          </span>
        </span>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>diamon</title>
            <polygon points="0,10 10,0 20,10 10,20, 0,10" />
          </svg>
          <span className="description">
            - Foul
          </span>
        </span>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>plus</title>
            <polygon
              points="0,13 0,7 7,7 7,0, 13,0 13,7 20,7 20,13, 13,13, 13,20, 7,20, 7,13, 0,13"
            />
          </svg>
          <span className="description">
            - In play, out(s)
          </span>
        </span>
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>x</title>
            <polygon points="0,3 3,0 10,7 17,0 20,3 13,10 20,17 17,20 10,13 3,20 0,17 7,10, 0,3" />
          </svg>
          <span className="description">
            - In play, no out
          </span>
        </span>
      </div>
    </div>
  );
};

export default Legend;
