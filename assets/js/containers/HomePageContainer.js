import React from 'react';
import StrikeZone from 'components/StrikeZone';
import Legend from 'components/Legend';
import axios from 'axios';
import classNames from 'classnames';
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
    const topBottomMap = {
      1: 'T',
      0: 'B',
    };
    const inningOptions = this.state.innings.map((inning) => {
      const isSelected = this.state.selectedInning === inning;
      const radioId = `inning-choice-${inning}`;
      return (
        <div key={inning}>
          <label
            className={classNames({
              'selector-wrapper': true,
              selected: isSelected,
            })}
            htmlFor={radioId}
          >
            <input
              className="selector"
              type="radio"
              name="innings"
              id={radioId}
              value={inning}
              onChange={event => this.changeInning(event)}
            />
            {inning}
          </label>
        </div>
      );
    });
    const topBottomOptions = [1, 0].map((topBottom) => {
      const isSelected = this.state.selectedTopBottom === topBottom;
      const radioId = `topbottom-choice-${topBottom}`;
      return (
        <div key={topBottom}>
          <label
            className={classNames({
              'selector-wrapper': true,
              selected: isSelected,
            })}
            htmlFor={radioId}
          >
            <input
              className="selector"
              type="radio"
              name="topBottom"
              id={radioId}
              value={topBottom}
              onChange={event => this.changeTopBottom(event)}
            />
            {topBottomMap[topBottom]}
          </label>
        </div>
      );
    });
    return (
      <div>
        <h2>Inning</h2>
        <div className={'selector-container'}>
          {inningOptions}
        </div>
        <h2>Top / Bottom</h2>
        <div className={'selector-container'}>
          {topBottomOptions}
        </div>
        <div className="centered">
          <StrikeZone pitches={this.state.pitches} width={300} height={300} />
        </div>
        <div className="padded">
          <Legend />
        </div>
      </div>
    );
  }
}
