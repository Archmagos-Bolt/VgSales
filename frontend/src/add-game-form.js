import React, { useState } from "react";
import axios from "axios";
import {Form, Input, Button, Collapse} from 'antd';

const { Panel } = Collapse;

const AddGameForm = () => {
  const [formData, setFormData] = useState({
    rank: '',
    name: '',
    platform: '',
    year: '',
    genre: '',
    publisher: '',
    na_sales: '',
    eu_sales: '',
    jp_sales: '',
    other_sales: '',
    global_sales: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/games', formData);
      console.log(response.data);
    } catch (error) {
      console.error('Error adding game', error);
    }
  }

return (
  <Collapse >
    <Panel header="Add New Game" key="1">
      <Form onSubmit={handleSubmit}>
      <Form.Item label="Rank">
      <Input name="rank" value={formData.rank} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Name">
      <Input name="name" value={formData.name} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Platform">
      <Input name="platform" value={formData.platform} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Year">
      <Input name="year" value={formData.year} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Genre">
      <Input name="genre" value={formData.genre} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Publisher">
      <Input name="publisher" value={formData.publisher} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="North America Sales">
      <Input name="na_sales" value={formData.na_sales} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Europe Sales">
      <Input name="eu_sales" value={formData.eu_sales} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Japan Sales">
      <Input name="jp_sales" value={formData.jp_sales} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Other Sales">
      <Input name="other_sales" value={formData.other_sales} onChange={handleChange} />
    </Form.Item>
    <Form.Item label="Global Sales">
      <Input name="global_sales" value={formData.global_sales} onChange={handleChange} />
    </Form.Item>
    <Form.Item>
    </Form.Item>
        <Button type="primary" htmlType="submit">
          Add Game
        </Button>
      </Form>
    </Panel>
  </Collapse>
);
};

export default AddGameForm;