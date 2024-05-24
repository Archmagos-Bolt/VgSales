import React from "react";
import axios from "axios";
import { Form, Input, Button, Collapse } from "antd";

const { Panel } = Collapse;

const AddGameForm = ({ onGameAdded }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const response = await axios.post("http://localhost:5000/sales", values);
      console.log("Game added:", response.data);
      onGameAdded(response.data);
      form.resetFields();
    } catch (error) {
      console.error("Error adding game:", error);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Collapse>
      <Panel header="Add New Game" key="1">
        <Form
          form={form}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="Rank"
            name="rank"
            rules={[{ required: false, message: "Please input the rank!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please input the game name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Year"
            name="year"
            rules={[{ required: true, message: "Please input the year!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Genre"
            name="genre"
            rules={[{ required: true, message: "Please input the genre!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Publisher"
            name="publisher"
            rules={[{ required: true, message: "Please input the publisher!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="North America Sales" name="na_sales">
            <Input />
          </Form.Item>
          <Form.Item label="Europe Sales" name="eu_sales">
            <Input />
          </Form.Item>
          <Form.Item label="Japan Sales" name="jp_sales">
            <Input />
          </Form.Item>
          <Form.Item label="Other Sales" name="other_sales">
            <Input />
          </Form.Item>
          <Form.Item label="Global Sales" name="global_sales">
            <Input />
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
