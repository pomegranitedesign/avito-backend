const express = require('express')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

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

app.get('/ads/:id', (req, res) => {
	const paramID = +req.params.id
	const hasDesc = req.query.hasDesc
	const hasAllImages = req.query.hasAllImages

	fs.readFile(filePath, (error, data) => {
		if (error) res.json({ error })

		const parsedData = JSON.parse(data)

		const ad = parsedData.find(
			({ title, id, price, images, description }) => {
				if (paramID === id) {
					return {
						title,
						price,
						images: hasAllImages ? images : images[0],
						description: hasDesc && description
					}
				}
			}
		)

		if (!ad) res.json({ error: 'Ad not found...' }).status(404)

		res.json({ ad })
	})
})

app.listen(PORT, () =>
	console.log(
		chalk.greenBright.bold(`✅ The server is running on port: ${PORT}`)
	)
)
