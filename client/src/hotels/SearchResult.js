import { useState, useEffect } from "react";
import queryString from "query-string";
import SmallCard from "../components/cards/SmallCard";
import { searchListings } from "../actions/hotel";
import Search from "../components/forms/Search";

const SearchResult = () => {
  const [hotels, setHotels] = useState([]);

useEffect(() => {
  const { location, from, to, bed } = queryString.parse(window.location.search);

  searchListings({ location, from, to, bed }).then((res) => {
    setHotels(res.data);
  }).catch(err => console.log("Search error:", err));
}, [window.location.search]);


  return (
    <>
      <div className="col">
        <br />
        <Search />
      </div>
      <div className="container">
        <div className="row">
          {hotels.map((h) => (
            <SmallCard key={h._id} h={h} />
          ))}
        </div>
      </div>
    </>
  );
};

export default SearchResult;
