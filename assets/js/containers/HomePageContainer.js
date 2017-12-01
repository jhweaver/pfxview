import React from 'react';
import Legend from 'components/Legend';
import RadioButtonSet from 'components/RadioButtonSet';
import StrikeZone from 'components/StrikeZone';
import axios from 'axios';
import './HomePageContainer.scss';

function pitchReducer(accumulator, atbat) {
  return accumulator.concat(atbat.pitches);
}

function inningReducer(accumulator, atbat) {
  return accumulator.includes(atbat.inning) ? accumulator : accumulator.concat(atbat.inning);
}

export default class HomePageContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pitches: [],
      atbats: [],
      innings: [],
      selectedInning: 1,
      selectedTopBottom: 1,
    };
  }

  componentDidMount() {
    axios
      .get('/game/gid_2017_08_21_bosmlb_clemlb_1/')
      .then(response => this.setState({
        pitches: response.data.atbats.filter(
          atbat => atbat.inning === this.state.selectedInning,
        ).filter(
          atbat => atbat.top_bottom === this.state.selectedTopBottom,
        ).reduce(pitchReducer, []),
        atbats: response.data.atbats,
        innings: response.data.atbats.reduce(inningReducer, []),
      }))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });
  }

  changeTopBottom(e) {
    const selected = parseInt(e.target.value, 0);
    // eslint-disable-next-line no-unused-vars
    this.setState(prevState => ({
      selectedTopBottom: selected,
      pitches: this.state.atbats.filter(
        atbat => atbat.inning === this.state.selectedInning,
      ).filter(
        atbat => atbat.top_bottom === selected,
      ).reduce(pitchReducer, []),
    }));
  }

  changeInning(e) {
    const selected = parseInt(e.target.value, 0);
    // eslint-disable-next-line no-unused-vars
    this.setState(prevState => ({
      selectedInning: selected,
      pitches: this.state.atbats.filter(
          atbat => atbat.inning === selected,
      ).filter(
          atbat => atbat.top_bottom === this.state.selectedTopBottom,
      ).reduce(pitchReducer, []),
    }));
  }

  render() {
    return (
      <div>
        <h2>Inning</h2>
        <RadioButtonSet
          iterable={this.state.innings}
          selectedVal={this.state.selectedInning}
          radioName="inning-choice-"
          name="innings"
          // eslint-disable-next-line react/jsx-no-bind
          onChange={this.changeInning.bind(this)}
        />
        <h2>Top / Bottom</h2>
        <RadioButtonSet
          iterable={[1, 0]}
          selectedVal={this.state.selectedTopBottom}
          radioName="topbottom-choice-"
          name="topbottoms"
          valueMap={{ 1: 'T', 0: 'B' }}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={this.changeTopBottom.bind(this)}
        />
        <div className="centered">
          <StrikeZone pitches={this.state.pitches} width={300} height={300} pitcherView />
        </div>
        <div className="padded">
          <Legend />
        </div>
      </div>
    );
  }
}
