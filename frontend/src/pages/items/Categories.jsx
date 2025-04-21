import React, { useState, useEffect } from "react";
import axios from "axios";
import CategoryForm from "../../components/category/CategoryForm";


const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };


  return (
    <div>
      <CategoryForm
        category={selectedCategory}
        onSuccess={() => {
          setSelectedCategory(null);
          fetchCategories();
        }}
      />

    </div>
  );
};

export default Categories;
