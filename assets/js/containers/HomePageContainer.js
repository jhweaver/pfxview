import React from 'react';
import StrikeZone from 'components/StrikeZone';
import axios from 'axios';

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
      selectedInning: null,
    };
  }

  componentDidMount() {
    axios
      .get('http://localhost:8000/game/gid_2017_08_21_bosmlb_clemlb_1/')
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

  changeInning(e) {
    const selected = parseInt(e.target.value, 0);
    // eslint-disable-next-line no-unused-vars
    this.setState(prevState => ({
      selectedInning: selected,
      pitches: this.state.atbats.filter(
          atbat => atbat.inning === selected,
      ).reduce(pitchReducer, []),
    }));
  }

  render() {
    const inningOptions = this.state.innings.map((inning) => {
      const isSelected = this.state.selectedInning === inning;
      const radioId = `inning-choice-${inning}`;
      return (
        <div key={inning} >
          <div>
            <label
              className={isSelected ? 'selector_selected' : 'selector'}
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
        </div>
      );
    });
    return (
      <div>
        {inningOptions}
        <StrikeZone pitches={this.state.pitches} width={300} height={300} />
      </div>
    );
  }
}
