const Product = require("../models/product")

const getAllProductsStatic = async (req, res) => {
  try {
    const products = await Product.find({ price: { $gt: 30 } })
      .sort("name")
      .select("name price")
      .limit(10)
      .skip(5)
    res.status(200).json({ products, nhHits: products.length })
  } catch (error) {
    throw new Error("it was not possible to find the products")
  }
}

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query
  const queryObject = {}

  if (featured) {
    queryObject.featured = featured === "true" ? true : false
  }
  if (company) {
    queryObject.company = company
  }
  if (name) {
    queryObject.name = { $regex: name, $options: "i" }
  }
  //numeric filters
  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    }
    const options = ["price", "rating"]
    const regEx = /\b(<|>|>=|=|<|<=)\b/g

    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    )

    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-")
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) }
      }
    })
  }

  console.log(queryObject)

  let result = Product.find(queryObject)
  // sort
  if (sort) {
    const sortList = sort.split(",").join(" ")

    result = result.sort(sortList)
  } else {
    result = result.sort("createAt")
  }
  //fields
  if (fields) {
    const fieldList = fields.split(",").join(" ")
    result = result.select(fieldList)
  }
  //pagination
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit

  result = result.skip(skip).limit(limit)

  const products = await result
  res.status(200).json({ products, nhHits: products.length })
}

module.exports = {
  getAllProducts,
  getAllProductsStatic,
}
