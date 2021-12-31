import React, { useState } from 'react';

const Fc = ({ name = 'John Doe', age = 25 }) => {
  const [some, setSome] = useState(1);
  const handleClick = (e) => {
    setSome(some + 1);
  };
  return (
    <div>
      <button onClick={handleClick}>click to change</button>
      <span>{name}</span>
      <span>{age}</span>
      <div>{some + 1}</div>
    </div>
  );
};

export default Fc;
