import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form, Input } from "antd";
import axios from "axios";

console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);

// Define columns for the review table
const reviewTable = (handleDeleteReview) => [
  {
    title: "Review Text",
    dataIndex: "review_text",
    key: "review_text",
  },
  {
    title: "Review Score",
    dataIndex: "review_score",
    key: "review_score",
  },
  {
    title: "Review Votes",
    dataIndex: "review_votes",
    key: "review_votes",
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, record) => (
      <>
        <Button danger onClick={() => handleDeleteReview(record)}>
          Delete
        </Button>
      </>
    ),
  },
];

// Create review form component
const ReviewForm = ({ gameName, setReviews }) => {
  const [form] = Form.useForm();

  // Handle form submission
  const handleReviewSubmit = async (values) => {
    const { reviewText, reviewScore } = values;
    try {
      const response = await axios.post("http://localhost:5000/reviews", {
        app_name: gameName,
        review_text: reviewText,
        review_score: reviewScore,
      });
      console.log("Review added:", response.data);
      setReviews((prev) => [...prev, response.data]);
      form.resetFields();
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  // Render form
  return (
    <Form
      form={form}
      layout="inline"
      onFinish={handleReviewSubmit}
      autoComplete="off"
    >
      <Form.Item label="Review Text" name="reviewText">
        <Input />
      </Form.Item>
      <Form.Item label="Review Score" name="reviewScore">
        <Input type="number" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit Review
        </Button>
      </Form.Item>
    </Form>
  );
};

const MainTable = () => {
  // Set up modal states
  const [games, setGames] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filter, setFilter] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortOrder, setSortOrder] = useState("ascend");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Fetch game data when the component mounts or when the sort order changes or when the pagination changes
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get(`/games`, {
          params: {
            page: pagination.current,
            limit: pagination.pageSize,
            sort_by: "rank",
            sort_order: sortOrder === "ascend" ? "asc" : "desc",
          },
        });
        setGames(response.data);
        setFilter(response.data);
        setPagination({
          ...params.pagination,
          total: response.data.total,
        });
      } catch (err) {
        console.error("Error fetching data: ", err);
      }
    };

    fetchGames();
  }, []);

  // Fetch reviews when a game is selected
  useEffect(() => {
    if (selectedGame && !editMode) {
      console.log("Fetching reviews for game:", selectedGame.name);
      axios
        .get(
          `http://localhost:5000/reviews/${encodeURIComponent(
            selectedGame.name
          )}`
        )
        .then((res) => {
          if (Array.isArray(res.data)) {
            setReviews(res.data);
          } else {
            console.error("Expected reviews to be an array but got:", res.data);
          }
        })
        .catch((err) => {
          console.error(
            `Error fetching reviews for game: ${selectedGame.name}`,
            err
          );
        });
    } else {
      setReviews([]);
    }
  }, [selectedGame, editMode]);

  // Function to handle review deletion
  const handleDeleteReview = async (review) => {
    try {
      await axios.delete(`http://localhost:5000/reviews/${review.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      console.log("Review deleted successfully");
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };
  const reviewColumns = reviewTable(handleDeleteReview);

  // Function to handle search
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchText(value);
    const filteredData = games.filter((game) => {
      return Object.keys(game).some((key) =>
        game[key].toString().toLowerCase().includes(value.toLowerCase())
      );
    });
    setFilter(filteredData);
  };

  const showModal = (game) => {
    setSelectedGame(game);
    setEditMode(false);
    setIsModalVisible(true);
  };

  // Functions to handle input change, edit toggle, save, and cancel
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Current value of ${name}:`, selectedGame[name]);
    console.log(`New value of ${name}:`, value);

    setSelectedGame((prev) => {
      const updated = { ...prev, [name]: value };
      console.log(`Updated state for ${name}:`, updated);
      return updated;
    });
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/sales/${selectedGame.id}`,
        selectedGame
      );
      if (response.status === 200) {
        const updatedGames = games.map((game) =>
          game.id === selectedGame.id ? { ...game, ...selectedGame } : game
        );
        setGames(updatedGames);
        setFilter(updatedGames);
        setIsModalVisible(false);
        setEditMode(false);
        console.log("Game details updated:", response.data);
      }
    } catch (error) {
      console.error("Failed to update game details:", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setReviews([]);
    setEditMode(false);
  };

  // Define columns for the main table
  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      sorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <button onClick={() => showModal(record)}>{text}</button>
      ),
      sorter: true,
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: true,
    },
    {
      title: "Genre",
      dataIndex: "genre",
      key: "genre",
      sorter: true,
    },
    {
      title: "Publisher",
      dataIndex: "publisher",
      key: "publisher",
      sorter: true,
    },
    {
      title: "North America Sales",
      dataIndex: "na_sales",
      key: "na_sales",
      sorter: true,
    },
    {
      title: "Europe Sales",
      dataIndex: "eu_sales",
      key: "eu_sales",
      sorter: true,
    },
    {
      title: "Japan Sales",
      dataIndex: "jp_sales",
      key: "jp_sales",
      sorter: true,
    },
    {
      title: "Other Sales",
      dataIndex: "other_sales",
      key: "other_sales",
      sorter: true,
    },
    {
      title: "Global Sales",
      dataIndex: "global_sales",
      key: "global_sales",
      sorter: true,
    },
    {
      title: "Review Count",
      dataIndex: "review_count",
      key: "review_count",
      sorter: true,
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("Table change:", pagination, filters, sorter);
    setPagination(pagination);
    setSortField(sorter.field);
    setSortOrder(sorter.order);
    fetchGames({ pagination, sorter });
  };
// Render modal and table
return (
  <>
    <Input
      placeholder="Search"
      value={searchText}
      onChange={handleSearch}
      style={{ marginBottom: 16, width: 200 }}
    />
    <Table
      dataSource={filter}
      columns={columns}
      rowKey="id"
      onChange={handleTableChange()}
    />
    {selectedGame && (
      <Modal
        title={editMode ? "Edit Game Details" : "Game Details"}
        open={isModalVisible}
        onOk={editMode ? handleSave : handleCancel}
        onCancel={handleCancel}
        footer={[
          <Button key="edit" onClick={handleEditToggle}>
            {editMode ? "Cancel" : "Edit"}
          </Button>,
          editMode && (
            <Button key="save" onClick={handleSave}>
              Save Changes
            </Button>
          ),
        ]}
      >
        {editMode ? (
          <Form layout="vertical">
            <Form.Item label="Rank">
              <Input
                name="rank"
                value={selectedGame.rank}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="Name">
              <Input value={selectedGame?.name} onChange={handleInputChange} />
            </Form.Item>
            <Form.Item label="Year">
              <Input value={selectedGame?.year} onChange={handleInputChange} />
            </Form.Item>
            <Form.Item label="Genre">
              <Input value={selectedGame?.genre} onChange={handleInputChange} />
            </Form.Item>
            <Form.Item label="Publisher">
              <Input
                value={selectedGame?.publisher}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="North America Sales">
              <Input
                value={selectedGame?.na_sales}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="Europe Sales">
              <Input
                value={selectedGame?.eu_sales}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="Japan Sales">
              <Input
                value={selectedGame?.jp_sales}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="Other Sales">
              <Input
                value={selectedGame?.other_sales}
                onChange={handleInputChange}
              />
            </Form.Item>
            <Form.Item label="Global Sales">
              <Input
                value={selectedGame?.global_sales}
                onChange={handleInputChange}
              />
            </Form.Item>
          </Form>
        ) : (
          <>
            <p>Platform: {selectedGame.platform}</p>
            <p>Publisher: {selectedGame.publisher}</p>
            <p>Year: {selectedGame.year}</p>
            <p>Genre: {selectedGame.genre}</p>
            <p>North America Sales: {selectedGame.na_sales}</p>
            <p>Europe Sales: {selectedGame.eu_sales}</p>
            <p>Japan Sales: {selectedGame.jp_sales}</p>
            <p>Other Sales: {selectedGame.other_sales}</p>
            <p>Global Sales: {selectedGame.global_sales}</p>
            <h2>Reviews</h2>
            <ReviewForm gameName={selectedGame.name} setReviews={setReviews} />
            <Table
              dataSource={reviews.filter((review) => review.review_score === 1)}
              columns={reviewColumns}
              pagination={{ pageSize: 10 }}
            />
            <Table
              dataSource={reviews.filter(
                (review) => review.review_score === -1
              )}
              columns={reviewColumns}
              pagination={{ pageSize: 10 }}
            />
          </>
        )}
      </Modal>
    )}
  </>
);
};
// Export the MainTable and ReviewForm components
export default MainTable;
export { ReviewForm };
