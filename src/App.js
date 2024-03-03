import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import md5 from "md5";

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [allDataReceived, setAllDataReceived] = useState(false);
  const itemsPerPage = 50;
  const [filters, setFilters] = useState({});

  const baseUrl = "https://api.valantis.store:41000/";
  const password = md5(
    `Valantis_${new Date().toISOString().split("T")[0].replaceAll("-", "")}`
  );
  const headers = {
    headers: {
      "X-Auth": password,
    },
  };

  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  const fetchBrands = async () => {
    try {
      const response = await axios.post(
        baseUrl,
        {
          "action": "get_fields",
          "params": { "field": "brand" },
        },
        headers
      );
      const uniqueBrands = [...new Set(response.data.result)];
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Ошибка при загрузке брендов:", error);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const maxRequests = 2;
  let uniqueIds;
  const fetchData = async (requestCount) => {
    try {
      if (Object.keys(filters).length === 0) {
        console.log("length===0");
        setLoading(true);
        const responseIds = await axios.post(
          baseUrl,
          {
            "action": "get_ids",
            "params": { "offset": (currentPage - 1) * 100, "limit": 100 },
          },
          headers
        );
        uniqueIds = await responseIds.data.result.filter((element, index) => {
          return responseIds.data.result.indexOf(element) === index;
        });

        if (responseIds.data.result.length === 0) {
          setAllDataReceived(true);
        }
      } else if (Object.keys(filters).length > 0) {
        const responseIds = await axios.post(
          baseUrl,
          {
            "action": "filter",
            "params": filters,
          },
          headers
        );
        uniqueIds = await responseIds.data.result.filter((element, index) => {
          return responseIds.data.result.indexOf(element) === index;
        });
        setItems([]);
      }

      const responseItems = await axios.post(
        baseUrl,
        {
          "action": "get_items",
          "params": { "ids": uniqueIds },
        },
        headers
      );
      const uniqueItems = responseItems.data.result.filter(
        (item, index, self) =>
          index === self.findIndex((element) => element.id === item.id)
      );

      setItems((prevState) => [...prevState, ...uniqueItems]);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка при выполнении запросов:", error);
      setLoading(false);
      fetchData(requestCount + 1);
      if (requestCount >= maxRequests) {
        console.log("Превышено количество попыток запроса");
      }
    }
  };

  useEffect(() => {
    if (!allDataReceived) {
      fetchData(0);
    }
  }, [currentPage, allDataReceived, filters]);

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleFilterChange = (filterName, value) => {
    setCurrentPage(1);
    setFilters((prevState) => ({
      ...prevState,
      [filterName]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleBrandChange = (filterName, value) => {
    setSelectedBrand(value);
    if (value !== "" || value !== null) {
      handleFilterChange(filterName, value);
    }
  };

  return (
    <div className="App">
      {console.log(items)}

      <input
        type="text"
        placeholder="Введите название"
        onChange={(e) => handleFilterChange("product", e.target.value)}
      />
      <input
        type="number"
        placeholder="Введите цену"
        onChange={(e) =>
          handleFilterChange("price", parseFloat(e.target.value))
        }
      />
      <select
        value={selectedBrand}
        onChange={(e) => handleBrandChange("brand", e.target.value)}
      >
        <option value="">Выберите бренд</option>
        {brands.map((brand, index) => (
          <option key={index} value={brand}>
            {brand}
          </option>
        ))}
      </select>

      <button onClick={handleResetFilters}>Сбросить фильтры</button>

      <ol>
        {items.length ? (
          items
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((item) => {
              return (
                <li key={item.id}>
                  {item.id}.{item.product} {item.brand}: {item.price}
                </li>
              );
            })
        ) : (
          <>Итемы не найдены</>
        )}
      </ol>

      <div>
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Назад
        </button>
        <button onClick={handleNextPage} disabled={loading}>
          Вперед
        </button>
      </div>
    </div>
  );
}

export default App;
