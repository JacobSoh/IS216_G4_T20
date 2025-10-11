import 'server-only'

import { buildStoragePublicUrl } from '@/utils/storage'

export class Auction {
	#aid
	#oid
	name
	start_time
	end_time
	description
	thumbnail_bucket
	object_path
	owner
	items

	constructor(data = {}) {
		this.#aid = data.aid ?? null
		this.#oid = data.oid ?? null
		this.name = data.name ?? ''
		this.start_time = data.start_time ? new Date(data.start_time) : null
		this.end_time = data.end_time ? new Date(data.end_time) : null
		this.description = data.description ?? ''
		this.thumbnail_bucket = data.thumbnail_bucket ?? data.thumbnailBucket ?? null
		this.object_path = data.object_path ?? data.thumbnail_path ?? null
		this.owner = data.owner ?? null
		this.items = Array.isArray(data.items) ? data.items : []
	}

	static fromRecord(record = {}) {
		return new Auction({
			...record,
			owner: record.owner ?? null,
			items: record.items ?? []
		})
	}

	attachItems(items = []) {
		this.items = items
		return this
	}

	setOwner(owner) {
		this.owner = owner
		return this
	}

	get aid() {
		return this.#aid
	}

	get oid() {
		return this.#oid
	}

	thumbnailUrl(baseUrl) {
		return buildStoragePublicUrl({
			bucket: this.thumbnail_bucket,
			objectPath: this.object_path,
			baseUrl
		})
	}

	getTimeWindow() {
		if (!this.start_time || !this.end_time) {
			return {
				ms: 0,
				s: 0,
				m: 0,
				rS: 0,
				rM: 0,
				h: 0
			}
		}
		const milliDiff = this.end_time.getTime() - this.start_time.getTime()
		const totalSeconds = Math.floor(milliDiff / 1000)
		const totalMinutes = Math.floor(totalSeconds / 60)
		const totalHours = Math.floor(totalMinutes / 60)
		const remSeconds = totalSeconds % 60
		const remMinutes = totalMinutes % 60
		return {
			ms: milliDiff,
			s: totalSeconds,
			m: totalMinutes,
			rS: remSeconds,
			rM: remMinutes,
			h: totalHours
		}
	}

	toPersistence() {
		return {
			aid: this.#aid,
			oid: this.#oid,
			name: this.name,
			start_time: this.start_time,
			end_time: this.end_time,
			description: this.description,
			thumbnail_bucket: this.thumbnail_bucket,
			object_path: this.object_path
		}
	}

	getJson() {
		return this.toPersistence()
	}
}
