const express = require('express')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid').v4

const PORT = process.env.PORT || 4000
const app = express()

// TODO Remove the filePath when the real cluster is made
const filePath = path.resolve(__dirname, 'data.json')

// Middlewares / Configs
app.use(express.json({ extended: false }))

// @Route
// @Public
// Desc -> GET All Ads
app.get('/ads', async (req, res) => {
	console.log(chalk.yellow.bold('⏳ Receiving ADS'))

	await fs.readFile(filePath, (error, data) => {
		if (error) res.json({ error })

		const page = +req.query.page
		const startIndex = (page - 1) * 10
		const endIndex = page * 10

		const ads = JSON.parse(data)
		const output = {}
		if (endIndex < ads.length)
			output.next = {
				page: page + 1
			}

		if (startIndex > 0)
			output.previous = {
				page: page - 1
			}

		const sortBy = req.query.sortBy
		const sortDirection = req.query.sortDirection

		if (sortBy === 'price')
			output.data = ads
				.slice(startIndex, endIndex)
				.sort(
					(a, b) =>
						sortDirection === 'asc'
							? a.price > b.price ? 1 : -1
							: a.price < b.price ? 1 : -1
				)
		else if (sortBy === 'dateCreated')
			output.data = ads
				.slice(startIndex, endIndex)
				.sort(
					(a, b) =>
						sortDirection === 'asc'
							? a.dateCreated > b.dataeCreated ? 1 : -1
							: a.dateCreated < b.dateCreated ? 1 : -1
				)
		else output.data = ads.slice(startIndex, endIndex)

		output.data = output.data.map(({ title, images, price }) => ({
			title,
			images,
			price
		}))
		res.json({ output })
		console.log(chalk.greenBright.bold('✅ ADS Received'))
	})
})

// @Route
// @Public
// Desc -> GET a single ad
app.get('/ads/:id', (req, res) => {
	const paramID = +req.params.id
	const hasDesc = req.query.hasDesc === 'true'
	const hasAllImages = req.query.hasAllImages === 'true'

	console.log(chalk.yellowBright.bold(`⏳ Receiving ad with id: ${paramID}`))

	fs.readFile(filePath, (error, data) => {
		if (error) res.json({ error })

		const parsedData = JSON.parse(data)
		const ad = parsedData.find((ad) => ad.id === paramID)
		if (!ad) res.json({ error: 'Ad not found...' }).status(404)

		const finalOutput = {
			id: ad.id,
			title: ad.title,
			price: ad.price
		}

		if (hasDesc) finalOutput.description = ad.description

		if (hasAllImages) finalOutput.images = ad.images
		else finalOutput.image = ad.images[0]

		res.json({ finalOutput })
		console.log(chalk.greenBright.bold(`✅ Get an ad with id: ${paramID}`))
	})
})

// @Route
// @Public
// Desc -> POST a new ad
app.post('/ads', (req, res) => {
	console.log(chalk.yellowBright.bold('⏳ Posting a new ad'))

	// Get all upcoming data from body
	const { title, price, description, images } = req.body

	// Generate an id
	const newID = uuid()

	// Validation
	const error = {}
	if (!title) error.title = 'Title must be included'
	else if (!price) error.price = 'Price must be included'

	if (title.length > 200) error.title = "Title's max length is 200 characters"
	else if (description.length > 1000)
		error.description = "Description's max length is 1000 characters"

	if (!images) error.images = 'At least one image must be included'
	else if (images.length > 3)
		error.images = 'Maximum of 3 image URLs are allowed'

	const output = {
		id: newID,
		title,
		price,
		description,
		images
	}

	if (error.title || error.description || error.price || error.images)
		return res.send(error).status(403)

	res.json({ id: newID, status: 200 }).status(200)
	console.log(chalk.greenBright.bold(`✅ New ad created`))
})

app.listen(PORT, () =>
	console.log(
		chalk.greenBright.bold(`✅ The server is running on port: ${PORT}`)
	)
)
