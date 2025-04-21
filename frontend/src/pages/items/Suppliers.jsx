import React, { useState, useEffect } from "react";
import axios from "axios";
import SupplierForm from "../../components/supplier/SupplierForm";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };
  return (
    <div>
      <SupplierForm
        supplier={selectedSupplier}
        onSuccess={() => {
          setSelectedSupplier(null);
          fetchSuppliers();
        }}
      />
    </div>
  );
};

export default Suppliers;
