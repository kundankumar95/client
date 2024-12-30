import React from 'react'
import './Home.css'
import image1 from '../assets/image1.png'

import image3 from '../assets/image3.png'


const Home = () => {
  return (
    <div className="explore-container">
      <div className="branch-row">
        <h2>Explore Our Game</h2>
        <div className="home-row">
          <div className="subject-card">
            <img  src={image1} alt="#" />
          </div>
         
          <div className="subject-card">
            <img src={image3} alt="#" />
          </div>
         
          
        </div>
      </div>
    </div>
  )
}

export default Home
