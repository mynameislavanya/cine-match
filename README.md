# CineMatch — Personalized Individual and Group Movie Recommendation System

## Project Overview

CineMatch is a web-based movie recommendation system that helps users discover movies based on their favourite genres, preferred languages, and ratings. It also allows users to create groups, combine movie preferences, and vote together to decide which movie to watch.

The system provides personalized recommendations using a **rule-based scoring algorithm** and group recommendations based on the preferences of group members.

## Features

### User Management
- User registration and login
- Secure password hashing
- JWT-based authentication
- Profile and preference management

### Movie Discovery
- Browse the movie catalogue
- Search for movies
- Filter movies by language and genre
- View movie details, posters, and ratings

### Personalized Recommendations
- Recommendations based on favourite genres and languages
- Ratings-based recommendation scoring
- Exclusion of movies already rated or added to the watchlist
- Ranked movie recommendations for each user

### Ratings and Reviews
- Rate movies
- Update existing ratings
- Write, edit, and delete reviews
- View movie ratings and reviews

### Watchlist
- Add movies to a personal watchlist
- Remove movies from the watchlist
- Mark movies as watched

### Group Recommendations and Voting
- Create a movie group
- Join groups using an invite code
- Generate recommendations based on group members' preferences
- Create a shortlist of recommended movies
- Vote for a shortlisted movie
- Change votes while voting is open
- Close voting and display the winning movie

## Movie Languages

The seeded movie catalogue includes movies in the following languages:

- English
- Hindi
- Tamil
- Malayalam
- Telugu
- Kannada

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| UI Library | Material UI |
| Routing | React Router DOM |
| API Requests | Axios |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcryptjs |
| Movie Poster Data | TMDB API |
| Development Tools | npm, Nodemon |

## Recommendation Method

CineMatch uses a **rule-based recommendation algorithm**, rather than a machine-learning model.

Individual movie recommendations are calculated using the following factors:

- Favourite language match: +3 points
- Each matching favourite genre: +1 point
- Genres associated with movies the user rated 4 or 5: up to +1 point per genre
- Movie average rating: multiplied by 0.4

Movies that the user has already rated or added to their watchlist are excluded from the recommendations.

For new users without saved preferences or ratings, the system recommends popular, highly rated movies.

For group recommendations, individual recommendation scores are averaged across group members. The top five movies are shortlisted for voting. The group creator closes voting, and the movie with the most votes wins. If votes are tied, the movie with the higher group recommendation score wins.

## Database Design

CineMatch uses SQLite to store user information, movie details, ratings, reviews, watchlists, groups, and votes.

The database contains the following tables:

| Table | Purpose |
|---|---|
| `users` | Stores user accounts and preferences |
| `movies` | Stores movie details and ratings |
| `ratings` | Stores user movie ratings |
| `reviews` | Stores user reviews |
| `watchlists` | Stores users' saved movies and watched status |
| `groups` | Stores group details, members, invite codes, shortlists, and results |
| `votes` | Stores votes cast by group members |

## Project Structure

```text
CineMatch/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/
│   ├── data/
│   │   └── cinematch.sqlite
│   ├── package.json
│   └── ...
└── README.md
```

*Note: The structure above is a simplified overview of the project.*

## Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Git (if cloning the repository)

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd CineMatch
```

Replace `<your-github-repository-url>` with your actual GitHub repository URL.

### 2. Install Backend Dependencies

Open a terminal in VS Code and run:

```bash
cd server
npm install
```

### 3. Start the Backend

From the `server` directory, run:

```bash
npm start
```

### 4. Install Frontend Dependencies

Open a second terminal in VS Code and run:

```bash
cd client
npm install
```

### 5. Start the Frontend

From the `client` directory, run:

```bash
npm run dev
```

### 6. Open the Application

Open the local URL displayed in the Vite terminal, usually:

```text
http://localhost:5173
```

Keep both the backend and frontend terminals running while using the application.


## Testing Checklist

The following areas can be tested manually:

- User registration and login
- Saving favourite genres and languages
- Browsing, searching, and filtering movies
- Viewing movie details
- Adding and updating ratings
- Creating, editing, and deleting reviews
- Adding and removing watchlist movies
- Marking movies as watched
- Viewing personalized recommendations
- Creating groups and joining through invite codes
- Generating group shortlists
- Casting and changing votes
- Closing voting and viewing the winner

## Future Enhancements

- Implement machine-learning-based recommendations.
- Add ranked-choice voting for group decisions.
- Allow group members to nominate movies.
- Expand the movie catalogue and language coverage.
- Improve recommendation accuracy using additional user activity and feedback.
- Add more advanced filtering and sorting options.

## Conclusion

CineMatch combines personalized movie recommendations with collaborative group decision-making. By considering user preferences, ratings, and group voting, the application helps individuals and groups find movies that suit their interests.
#### External API used: 
The project uses the **TMDB (The Movie Database) API** to retrieve movie poster information and enrich poster URLs. Seeded movie data and fallback posters help the core application work even when TMDB is unavailable.

