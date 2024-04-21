import React, { useEffect, useState } from 'react';
import {Table} from 'antd';
import axios from 'axios';
import {Modal} from 'antd';

// Define columns for the review table
const reviewTable = [
  {
    title: 'Review Text',
    dataIndex: 'review_text',
    key: 'review_text',
  },
  {
    title: 'Review Score',
    dataIndex: 'review_score',
    key: 'review_score',
  },
  {
    title: 'Review Votes',
    dataIndex: 'review_votes',
    key: 'review_votes',
  }
];

const MainTable = () => {

  // Set up modal states
  const [games, setGames] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [reviews, setReviews] = useState([]);

  // Fetch game data when the component mounts
  useEffect(() => {
    axios.get('/games')
      .then(res => {
        setGames(res.data);
      })
      .catch(err => {
        console.error('Error fetching data: ', err);

      });
  }, []);
  
  // Fetch reviews when a game is selected
  useEffect(() => {
    if (selectedGame) {
      console.log("Fetching reviews for game:", selectedGame.name);
      axios.get(`/reviews/${encodeURIComponent(selectedGame.name)}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setReviews(res.data);
        } else {
          console.error('Expected reviews to be an array but got:', res.data);
        }
      })
      .catch(err => {
        console.error(`Error fetching reviews for game: ${selectedGame.name}`, err);
      });
    }
  }, [selectedGame]);
    
// Functions to show and hide modal
const showModal = (game) => {
  console.log("Fetching reviews for game:", game.name);
  setSelectedGame(game);
  setIsModalVisible(true);

};
const handleOk = () => {
  setIsModalVisible(false);
  setReviews([]);
};
const handleCancel = () => {
  setIsModalVisible(false);
  setReviews([]);
};


  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <button onClick={() => showModal(record)}>{text}</button>
      ),
      sorter: true,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      sorter: true,
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: true,
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      key: 'genre',
      sorter: true,
    },
    {
      title: 'Publisher',
      dataIndex: 'publisher',
      key: 'publisher',
      sorter: true,
    },
      {
        title: 'North America Sales',
        dataIndex: 'na_sales',
        key: 'na_sales',
        sorter: true,
      },
      {
        title: 'Europe Sales',
        dataIndex: 'eu_sales',
        key: 'eu_sales',
        sorter: true,
      },
      {
        title: 'Japan Sales',
        dataIndex: 'jp_sales',
        key: 'jp_sales',
        sorter: true,
      },
      {
        title: 'Other Sales',
        dataIndex: 'other_sales',
        key: 'other_sales',
        sorter: true,
      },
      {
        title: 'Global Sales',
        dataIndex: 'global_sales',
        key: 'global_sales',
        sorter: true,
      },
    {
      title: 'Review Count',
      dataIndex: 'review_count',
      key: 'review_count',
      sorter: true,
    }
  ]

  // Render the table and modal
return (
  <>
    <Table dataSource={games} columns={columns} rowKey="id" />
    {selectedGame && (
      <Modal
        title="Game Details"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>Platform: {selectedGame?.platform}</p>
        <p>Year: {selectedGame?.year}</p>
        <p>Genre: {selectedGame?.genre}</p>
        <p>Publisher: {selectedGame?.publisher}</p>
        <p>North America Sales: {selectedGame?.na_sales}</p>
        <p>Europe Sales: {selectedGame?.eu_sales}</p>
        <p>Japan Sales: {selectedGame?.jp_sales}</p>
        <p>Other Sales: {selectedGame?.other_sales}</p>
        <p>Global Sales: {selectedGame?.global_sales}</p>
        <h2>Reviews</h2>

        <h2>Positive Reviews</h2>
        <Table dataSource= {reviews.filter(review => review.review_score === 1)} columns = {reviewTable} pagination = {{pageSize: 10}}></Table>
          
        <h2>Negative Reviews</h2>
        <Table dataSource= {reviews.filter(review => review.review_score === -1)} columns = {reviewTable} pagination = {{pageSize: 10}}></Table>
      </Modal>
    )}
  </>
);
}

export default MainTable;