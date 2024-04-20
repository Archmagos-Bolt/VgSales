import React, { useEffect, useState } from 'react';
import {useParams} from 'react-router-dom';
import axios from 'axios';

// GameDetail component
const GameDetail = () => {
  const { name } = useParams();
  const [gameDetails, setGameDetails] = useState(null);

  // Fetch game details when the component mounts
  useEffect(() => {
    const gameName = decodeURIComponent(name);
    axios.get(`/games/${gameName}`)
      .then(response => setGameDetails(response.data))
      .catch(error => console.error('Error fetching game details', error));
  }, [name]);

  // Display a loading message while the game details are being fetched
  if (!gameDetails) {
    return <div>Loading...</div>;
  }
  // Display the game details, rank removed as it is not needed for single games
  return (
    <div>
      <h1>{gameDetails.name}</h1>
      <p>Platform: {gameDetails.platform}</p>
      <p>Year: {gameDetails.year}</p>
      <p>Genre: {gameDetails.genre}</p>
      <p>Publisher: {gameDetails.publisher}</p>
      <p>North America Sales: {gameDetails.na_sales}</p>
      <p>Europe Sales: {gameDetails.eu_sales}</p>
      <p>Japan Sales: {gameDetails.jp_sales}</p>
      <p>Other Sales: {gameDetails.other_sales}</p>
      <p>Global Sales: {gameDetails.global_sales}</p>
    </div>
  );
};

export default GameDetail;