from locust import HttpUser, task, between
import random
import string
import logging

class MyAppUser(HttpUser):
    wait_time = between(1, 5)
    host = "http://localhost:5000"

    def on_start(self):
        self.sale_ids = []
        self.review_ids = {}

    def create_unique_id(self):
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

    @task
    def get_games(self):
        with self.client.get("/games", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to fetch games: {response.status_code}")

    @task
    def post_sales(self):
        unique_id = self.create_unique_id()
        with self.client.post("/sales", json={
            "rank": 1,
            "name": f"Test Game {unique_id}",
            "year": 2022,
            "genre": "Action",
            "publisher": "Test Publisher",
            "na_sales": 0.1,
            "eu_sales": 0.1,
            "jp_sales": 0.1,
            "other_sales": 0.1,
            "global_sales": 0.4
        }, catch_response=True) as response:
            if response.status_code == 201:
                sale_id = response.json().get('id')
                if sale_id:
                    self.sale_ids.append(sale_id)
                    # Create a review for the new game
                    self.add_review_for_game(sale_id)
            else:
                response.failure(f"Failed to create sale: {response.status_code}")

    def add_review_for_game(self, sale_id):
        with self.client.post("/reviews", json={
            "app_id": sale_id,
            "review_text": "This is a test review.",
            "review_score": 1
        }, catch_response=True) as response:
            if response.status_code == 201:
                review_id = response.json().get('id')
                if review_id:
                    if sale_id not in self.review_ids:
                        self.review_ids[sale_id] = []
                    self.review_ids[sale_id].append(review_id)
            else:
                logging.error(f"Failed to add review for sale_id {sale_id}: {response.text}")
                response.failure(f"Failed to add review: {response.status_code}")

    @task
    def delete_sales(self):
        if self.sale_ids:
            sale_id = self.sale_ids.pop(0)
            with self.client.delete(f"/sales/{sale_id}", catch_response=True) as response:
                if response.status_code != 200:
                    response.failure(f"Failed to delete sale: {response.status_code}")
                else:
                    # Also delete associated reviews
                    if sale_id in self.review_ids:
                        for review_id in self.review_ids[sale_id]:
                            self.client.delete(f"/reviews/{review_id}")
                        del self.review_ids[sale_id]

    @task
    def add_review(self):
        if self.sale_ids:
            sale_id = random.choice(self.sale_ids)
            self.add_review_for_game(sale_id)

    @task
    def delete_review(self):
        if self.review_ids:
            sale_id = random.choice(list(self.review_ids.keys()))
            if self.review_ids[sale_id]:
                review_id = self.review_ids[sale_id].pop(0)
                with self.client.delete(f"/reviews/{review_id}", catch_response=True) as response:
                    if response.status_code != 200:
                        response.failure(f"Failed to delete review: {response.status_code}")
                    if not self.review_ids[sale_id]:  # If no more reviews, remove the sale_id entry
                        del self.review_ids[sale_id]

    @task
    def get_reviews(self):
        if self.sale_ids:
            sale_id = random.choice(self.sale_ids)
            with self.client.get(f"/reviews/{sale_id}", catch_response=True) as response:
                if response.status_code != 200 and response.status_code != 404:
                    response.failure(f"Failed to fetch reviews: {response.status_code}")
                elif response.status_code == 404:
                    response.success()

    def on_stop(self):
        for sale_id in self.sale_ids:
            self.client.delete(f"/sales/{sale_id}")
        for sale_id, review_ids in self.review_ids.items():
            for review_id in review_ids:
                self.client.delete(f"/reviews/{review_id}")
