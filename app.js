const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorsDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//API for list of all movies
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT 
    movie_name
    FROM
    movie
    ORDER BY 
    movie_id
    `;

  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertMovieDbObjectToResponseObject(eachMovie)
    )
  );
});

//API for create new movie in the movie table
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;

  const addNewMovieQuery = `
    INSERT INTO
        movie (director_id, movie_name, lead_actor)
    VALUES
        ('${directorId}', '${movieName}', '${leadActor}');
  `;

  const newMovie = await db.run(addNewMovieQuery);
  response.send("Movie Successfully Added");
});

//API for return a movie based on movie_id
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `
    SELECT
    *
    FROM
        movie
    WHERE
        movie_id = ${movieId};
    `;

  const movie1 = await db.get(getMovieQuery);
  response.send(convertMovieDbObjectToResponseObject(movie1));
});

//API for update the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `
    UPDATE
        movie
    SET
        director_id = '${directorId}',
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE
        movie_id = ${movieId};
  `;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API for delete a movie from the movie table
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieQuery = `
    DELETE
    FROM
    movie
    WHERE
    movie_id = ${movieId};
    `;

  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API for list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT
        *
        FROM
        director
        ORDER BY
        director_id;
    `;

  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorsDbObjectToResponseObject(eachDirector)
    )
  );
});

//API for list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getListOfAllMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie
        WHERE
            director_id = ${directorId}
        ORDER BY
            director_id;
    `;

  const allMoviesArray = await db.all(getListOfAllMoviesQuery);
  response.send(
    allMoviesArray.map((eachMovie) =>
      convertMovieDbObjectToResponseObject(eachMovie)
    )
  );
});

module.exports = app;
