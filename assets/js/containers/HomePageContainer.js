import React from 'react';
import StrikeZone from 'components/StrikeZone';

/* You also get this warning in v1.x if you write your root component as
   stateless plain function instead of using React.Component. This problem
   is already solved completely in the upcoming v3.x.
   https://github.com/gaearon/react-hot-loader/blob/4978bffbb82a2508cf5d4ef2eee8b9b9101284ad/docs/Troubleshooting.md */
// eslint-disable-next-line react/prefer-stateless-function
export default class HomePageContainer extends React.Component {
  render() {
    const pitches = [
      { pfx_x: -0.7, pfx_z: 1.5, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'FF', code: 'C' },
      { pfx_x: null, pfx_z: 2.5, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'SL', code: 'S' },
      { pfx_x: 1, pfx_z: 2.5, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'CH', code: 'F' },
      { pfx_x: 0, pfx_z: 3.5, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'XX', code: 'F' },
      { pfx_x: 0.1, pfx_z: 2.5, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'CU', code: 'X' },
    ];
    return <StrikeZone pitches={pitches} width={300} height={300} />;
  }
}
