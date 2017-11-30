import React from 'react';
import PropTypes from 'prop-types';

function addPitch(ctx, pitch, size, width, footToPixel, topOfFrame, pitchNum) {
  const x = (pitch.pfx_x * footToPixel) + (width / 2);
  const z = (topOfFrame - pitch.pfx_z) * footToPixel;
  ctx.beginPath();
  ctx.lineWidth = size / 3;

  if (['FT', 'FF', 'FS', 'FC'].includes(pitch.pitch_type)) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.33)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.33)';
  } else if (pitch.pitch_type === 'SL') {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.33)';
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.33)';
  } else if (pitch.pitch_type === 'CU') {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.33)';
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.33)';
  } else if (pitch.pitch_type === 'CH') {
    ctx.fillStyle = 'rgba(0, 127, 127, 0.33)';
    ctx.strokeStyle = 'rgba(0, 127, 127, 0.33)';
  } else {
    ctx.fillStyle = 'rgba(127, 127, 0, 0.33)';
    ctx.strokeStyle = 'rgba(127, 127, 0, 0.33)';
  }

  if (pitch.code === 'C') {
    // Circle
    ctx.ellipse(x, z, size, size, 0, 0, 2 * Math.PI);
    ctx.fill();
  } else if (['B', '*B'].includes((pitch.code))) {
    // Square
    ctx.rect(x - size, z - size, size * 2, size * 2);
    ctx.fill();
  } else if (pitch.code === 'S') {
    // Triangle
    ctx.beginPath();
    ctx.moveTo(x - size, z + size);
    ctx.lineTo(x, z - size);
    ctx.lineTo(x + size, z + size);
    ctx.lineTo(x - size, z + size);
    ctx.fill();
  } else if (pitch.code === 'F') {
    // +
    ctx.beginPath();
    ctx.moveTo(x - size, z);
    ctx.lineTo(x + size, z);
    ctx.moveTo(x, z - size);
    ctx.lineTo(x, z + size);
    ctx.stroke();
  } else if (pitch.code === 'X') {
    // X
    ctx.beginPath();
    ctx.moveTo(x - size, z + size);
    ctx.lineTo(x + size, z - size);
    ctx.moveTo(x - size, z - size);
    ctx.lineTo(x + size, z + size);
    ctx.stroke();
  }
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(pitchNum, x - (size / 2), z + (size / 2));
}

class StrikeZone extends React.Component {

  componentDidMount() {
    this.updateCanvas();
  }


  updateCanvas() {
    // eslint-disable-next-line react/no-string-refs
    const ctx = this.refs.canvas.getContext('2d');
    const width = this.props.width;
    const height = this.props.height;
    const widthInFeet = 2.75;
    const plateWidth = 1.42;
    const footToPixel = width / widthInFeet;
    const topOfFrame = 3.75;
    const topOfZone = this.props.pitches[0].sz_top;
    const bottomOfZone = this.props.pitches[0].sz_bot;
    const zoneHeight = topOfZone - bottomOfZone;
    const baseballRadius = 0.12;
    const baseballRadiusPixels = baseballRadius * footToPixel;

    // Draw the zone
    ctx.beginPath();
    ctx.rect(1, 1, width - 1, height - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(
      ((widthInFeet - plateWidth) * footToPixel) / 2,
      (topOfFrame - topOfZone) * footToPixel,
      plateWidth * footToPixel,
      zoneHeight * footToPixel,
    );
    ctx.stroke();

    // eslint-disable-next-line func-names
    this.props.pitches.forEach((pitch, pitchNum) => {
      addPitch(ctx, pitch, baseballRadiusPixels, width, footToPixel, topOfFrame, pitchNum + 1);
    });
  }


  render() {
    return (
      // eslint-disable-next-line react/no-string-refs
      <canvas ref="canvas" width={this.props.width} height={this.props.height} />
    );
  }
}

StrikeZone.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  pitches: PropTypes.arrayOf(
    PropTypes.shape({
      pfx_x: PropTypes.number,
      pfx_z: PropTypes.number,
      sz_top: PropTypes.number,
      sz_bot: PropTypes.number,
      pitch_type: PropTypes.string,
      code: PropTypes.string,
    }),
  ).isRequired,
};

export default StrikeZone;
