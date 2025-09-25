// src/components/LocationAutocomplete.jsx
import { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  Paper,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const LocationAutocomplete = ({
  value,
  onChange,
  placeholder = "Enter location...",
  variant = "outlined",
  fullWidth = true,
  size = "medium",
  disabled = false,
  error = false,
  helperText = "",
  label = "Location",
  required = false,
  apiKey = process.env.REACT_APP_GEOCODE_API,
  ...otherProps
}) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // 🔎 Search with GeoApify
  const searchWithGeoApify = async (query) => {
    if (!apiKey || !query || query.length < 2) return [];

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query
        )}&apiKey=${apiKey}`,
        { signal: abortControllerRef.current?.signal }
      );

      if (!response.ok) throw new Error("Failed to fetch locations");

      const data = await response.json();

      return (
        data.features?.map((feature, index) => ({
          id: feature.properties.place_id || index,
          name: feature.properties.formatted,
          country: feature.properties.country || "",
          type: feature.properties.result_type || "location",
          lat: feature.properties.lat,
          lon: feature.properties.lon,
        })) || []
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("GeoApify error:", error);
      }
      return [];
    }
  };

  // 📌 Effect: fetch results when typing
  useEffect(() => {
    const fetchLocations = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (!inputValue || inputValue.length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const results = await searchWithGeoApify(inputValue);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, apiKey]);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const handleChange = (event, newValue) => {
    onChange?.(newValue);
  };

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option?.name || ""}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      filterOptions={(x) => x} // disable default filtering
      PaperComponent={({ children, ...props }) => (
        <Paper elevation={8} {...props}>
          {children}
        </Paper>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant={variant}
          fullWidth={fullWidth}
          size={size}
          disabled={disabled}
          error={error}
          helperText={helperText}
          required={required}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <LocationOnIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <LocationOnIcon sx={{ mr: 1, color: "text.secondary" }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1">{option.name}</Typography>
              {option.country && (
                <Typography variant="caption" color="text.secondary">
                  {option.country}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
      noOptionsText={
        inputValue.length < 2
          ? "Type at least 2 characters to search..."
          : "No locations found"
      }
      {...otherProps}
    />
  );
};

export default LocationAutocomplete;
