import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './RadioButtonSet.scss';

// eslint-disable-next-line arrow-body-style
const RadioButtonSet = (props) => {
  const options = props.iterable.map((val) => {
    const isSelected = props.selectedVal === val;
    const radioId = `${props.radioName}-${val}`;
    return (
      <div key={val}>
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
            name={props.name}
            id={radioId}
            value={val}
            onChange={event => props.onChange(event)}
          />
          { (Object.keys(props.valueMap).length !== 0) ? props.valueMap[val] : val}
        </label>
      </div>
    );
  });
  return (
    <div>
      <div className="selector-container">
        {options}
      </div>
    </div>
  );
};

RadioButtonSet.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  iterable: PropTypes.array.isRequired,
  selectedVal: PropTypes.any.isRequired,
  radioName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  valueMap: PropTypes.object,
  /* eslint-enable react/forbid-prop-types */
};

RadioButtonSet.defaultProps = {
  valueMap: {},
};

export default RadioButtonSet;
