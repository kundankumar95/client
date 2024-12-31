import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Points.css';

const Points = () => {
  const pointsArray = [1];
  // const pointValue = 20;
  const navigate = useNavigate();

  const handlePurchase = (price, numberOfPoints) => {
    navigate('/payment', { state: { amount: price, numberOfPoints } });
  };


  return (
    <div>
    <h2>Shop Now</h2>
    <table className="points-table">
      <thead>
        <tr>
          <th>Rupees</th>
          <th>Rolls</th>
          <th>Coins</th>
        </tr>
      </thead>
      <tbody>
        {pointsArray.map((point) => {
          const Rupees = 10; 
          const Rolls = 1; 
          const coins = 20;

          return (
            <tr key={point}>
              <td>{Rupees}</td>
              <td>
                <button
                  className="value-button"
                  onClick={() => handlePurchase(Rolls, Rolls)}
                >
                  {Rolls} 
                </button>
              </td> 

             
              <td>
                <button
                  className="value-button"
                  onClick={() => handlePurchase(coins, coins)}
                >
                  {coins}
                </button>
              </td> 
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>


  );
};

export default Points;