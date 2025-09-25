import React, { useState } from "react";
import { DatePicker, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import LocationAutocomplete from "../LocationAutoComplete";
import moment from "moment";
import { useHistory } from "react-router-dom";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Search = () => {
  const [location, setLocation] = useState("");
  const [toDate, setToDate] = useState([]);
  const [bed, setBed] = useState("");

  const history = useHistory();
  const handleSubmit = () => {
    let ln = "";
    if (location && location.name) {
      ln = location.name;
    } else {
      ln = "";
    }



let formatted = ["", ""];

if (toDate && toDate.length === 2) {
  formatted = [
    moment(toDate[0]).format("YYYY-MM-DD"),
    moment(toDate[1]).format("YYYY-MM-DD"),
  ];
}

console.log("DATE ======> ", formatted);

history.push(
  `/search-result?location=${ln || ""}&from=${formatted[0]}&to=${formatted[1]}&bed=${bed || ""}`
);
  };

  return (
    <div className="d-flex pb-4">
      <div className="w-100">
        <LocationAutocomplete
          value={location}
          onChange={(newLocation) => setLocation(newLocation)}
          placeholder="Enter hotel location..."
        />
      </div>

      <RangePicker
        onChange={(value) => setToDate(value)}
        disabledDate={(current) =>
          current && current.valueOf() < moment().subtract(1, "days")
        }
        className="w-100"
      />

      <Select
        onChange={(value) => setBed(value)}
        className="w-100"
        size="large"
        placeholder="Number of beds"
      >
        <Option key={1}>{1}</Option>
        <Option key={2}>{2}</Option>
        <Option key={3}>{3}</Option>
        <Option key={4}>{4}</Option>
      </Select>

      <SearchOutlined
        onClick={handleSubmit}
        className="btn btn-primary p-3 btn-square"
      />
    </div>
  );
};

export default Search;
