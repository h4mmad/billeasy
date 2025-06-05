### Design decisions

1. Book genre will be an enum, because for filtering it'll be easier and will enforce consistency, use enum and fail fast.

2. Should I include one genre for one book or a single book can be under multiple genres.

3. If multiple genres per book, how to store it in db
4. For genres keep an enum in application code rather than in db schema, because adding a new genre would require only altering application code

5. Filters work first and then pagination

6. Assume avg rating is for the book not per page of reviews

7. Assume rating given is whole number (ex. 4/5)

### Todo

- [ ] Set up custom error handler with Posgress specific codes (ex. 2305) and other
