import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form, Input } from "antd";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";


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
      console.log("Review added:", response.data.data);
      setReviews((prev) => [...prev, response.data.data]);
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
  const [sortBy, setSortBy] = useState([{field: "name", order: "ascend"}])
  const [sortOrder, setSortOrder] = useState("ascend");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchColumns, setSearchColumns] = useState({});
  const [total, setTotal] = useState(0);

  // Fetch game data when the component mounts or when the sort order changes or when the pagination changes
  const fetchGames = async (page = 1, limit = 10, sortBy=[{field: "name", order: "ascend"}], searchParams = {}) => {
    try {
      const response = await axios.get(`http://localhost:5000/games`, {
        params: {
          page,
          limit,
          sort_by: sortBy.map(sort => sort.field ).join(','),
          sort_order: sortBy.map((sort) => sort.order=== 'descend' ? 'DESC' : 'ASC' ).join(","),
          ...searchParams,
        },
      });
      setGames(response.data.data);
      setTotal(response.data.total);
  } catch (err) {
      console.error("Error fetching data: ", err);
     }
  };


  useEffect(() => {
    const searchParams = Object.entries(searchColumns).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    fetchGames(pagination.current, pagination.pageSize, sortBy, searchParams);
}, [pagination, sortBy, sortOrder, searchColumns]);
  

  // Fetch reviews when a game is selected
  useEffect(() => {
    if (selectedGame && !editMode) {
      console.log("Fetching reviews for game:", selectedGame.id);
      axios
        .get(
          `http://localhost:5000/reviews/${encodeURIComponent(
            selectedGame.id
          )}`
        )
        .then((res) => {
          console.log("Fetched Reviews:", res.data.data); 
          if (Array.isArray(res.data.data)) {
            setReviews(res.data.data);
          } else {
            console.error("Expected reviews to be an array but got:", res.data.data);
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
  }, [selectedGame, editMode, searchColumns]);

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
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
   confirm();
   setSearchColumns({ ...searchColumns, [dataIndex]: selectedKeys[0] });

  };

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setSearchColumns({ ...searchColumns, [dataIndex]:""});
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange = {e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
        type = "primary"
        onClick = {() => handleSearch(selectedKeys, confirm, dataIndex)}
        size = "small"
        style={{ width: 90, marginRight: 8 }}        
        >
          Search
        </Button>
        <Button onClick = {() => handleReset(clearFilters, dataIndex)} size = "small" style = {{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style = {{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });


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
        console.log("Game details updated:", response.data.data);
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
      ...getColumnSearchProps("rank"),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <button onClick={() => showModal(record)}>{text}</button>
      ),
      sorter: true,
      ...getColumnSearchProps("name"),
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: true,
      ...getColumnSearchProps("year"),
    },
    {
      title: "Genre",
      dataIndex: "genre",
      key: "genre",
      sorter: true,
      ...getColumnSearchProps("genre"),
    },
    {
      title: "Publisher",
      dataIndex: "publisher",
      key: "publisher",
      sorter: true,
      ...getColumnSearchProps("publisher"),
    },
    {
      title: "North America Sales",
      dataIndex: "na_sales",
      key: "na_sales",
      sorter: true,
      ...getColumnSearchProps("na_sales"),
    },
    {
      title: "Europe Sales",
      dataIndex: "eu_sales",
      key: "eu_sales",
      sorter: true,
      ...getColumnSearchProps("eu_sales"),
    },
    {
      title: "Japan Sales",
      dataIndex: "jp_sales",
      key: "jp_sales",
      sorter: true,
      ...getColumnSearchProps("jp_sales"),
    },
    {
      title: "Other Sales",
      dataIndex: "other_sales",
      key: "other_sales",
      sorter: true,
      ...getColumnSearchProps("other_sales"),
    },
    {
      title: "Global Sales",
      dataIndex: "global_sales",
      key: "global_sales",
      sorter: true,
      ...getColumnSearchProps("global_sales"),
    },
    {
      title: "Review Count",
      dataIndex: "review_count",
      key: "review_count",
      sorter: true,
      ...getColumnSearchProps("review_count"),
    },
  ];

  const handleTableChange = (newPagination, filters, sorter) => {
    let sortBy=[];
    if (Array.isArray(sorter)){
      sortBy = sorter.map(s=>({field: s.field, order: s.order}));
    }
    else {
      sortBy = [{field: sorter.field || "name", order: sorter.order === "descend" ? "DESC" : "ASC"}];
    }
    const searchParams = Object.entries(searchColumns).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }
    , {});
    fetchGames(newPagination.current, newPagination.pageSize, sortBy, searchParams);
    setPagination(newPagination);
    setSortBy(sortBy);    
  };

// Render modal and table
return (
  <>
    <Input
      placeholder="Search"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      style={{ marginBottom: 16, width: 200 }}
    />
    <Table
      dataSource={games}
      columns={columns}
      rowKey="id"
      onChange={handleTableChange}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: total,
      }}
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
