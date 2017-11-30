import React from 'react';
import StrikeZone from 'components/StrikeZone';
import axios from 'axios';

function pitchReducer(accumulator, atbat) {
  return accumulator.concat(atbat.pitches);
}

export default class HomePageContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pitches: [{ px: -7.775, pz: 10.9548, sz_top: 3.3, sz_bot: 1.4, pitch_type: 'FF', code: 'C' }],
      atbats: [],
      innings: [],
    };
  }

  componentDidMount() {
    axios
      .get('http://localhost:8000/game/gid_2017_08_21_bosmlb_clemlb_1/')
      .then(response => this.setState({
        pitches: response.data.atbats.reduce(pitchReducer, []),
      }))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });
  }

  render() {
    return <StrikeZone pitches={this.state.pitches} width={300} height={300} />;
  }
}
