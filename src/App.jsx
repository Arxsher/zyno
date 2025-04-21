import React, { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from"./components/Spinner";
import Card from "./components/Card";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";


const API_URL = "https://api.themoviedb.org/3/";

const API_KEY = import.meta.env.VITE_IMDB_API_KEY;

const API_OPT = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounced, setDebounced] = useState('');

  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce( () => setDebounced(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage("");


    try {
      const endpoint = query 
  ? `${API_URL}search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}`
  : `${API_URL}discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`;

      const response = await fetch(endpoint, API_OPT);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.response === "false") {
        console.log(data.error || "Failed to fetch movies");
        setMoviesList([]);
        return;
      }

      setMoviesList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.log(`Error fetching movies: ${error}`);

      setErrorMessage("Error fetching movies. please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies:${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debounced);
  }, [debounced]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);
  

  return (
    <main>
      <div className="pattern"></div>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span>You'll enjoy
            Without the hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
              </ul>  
          </section>
        )}

        <section className="all-movies">
          <div className="movies">
            <h2 className="text-center mt-10">Popular Movies</h2>
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500 text-sm text-center">{errorMessage}</p>
            ) : ( 
              <ul>
                {moviesList.map((movie) => (
                    <Card key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default App;