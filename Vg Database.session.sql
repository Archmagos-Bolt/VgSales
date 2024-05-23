SELECT reviews.review_text, reviews.review_score, reviews.review_votes, reviews.id
FROM reviews
WHERE reviews.app_id = 11877 AND reviews.review_score = -1
ORDER BY reviews.review_votes DESC, reviews.review_text ASC
LIMIT 10 OFFSET 0;