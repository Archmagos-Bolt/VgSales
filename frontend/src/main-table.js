import React, { useEffect, useState } from 'react';
import {Table} from 'antd';
import axios from 'axios';

const MainTable = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    axios.get('/games')
      .then(res => {
        setGames(res.data);
      })
      .catch(err => {
        console.error('Error fetching data: ', err);

      });
  }, []);


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

return <Table dataSource={games} columns={columns} rowKey="id"/>;

};

export default MainTable;