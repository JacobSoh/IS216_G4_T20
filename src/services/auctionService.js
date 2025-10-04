import 'server-only';
import { Auction } from '@/models/auction';
import {
    retrieveAllAuctions,
    insertAuction,
    retrieveAuctionById,
    upAuctionById,
    delAuctionById
} from '@/repositories/auctionRepo';

const validateParam = async (data) => {
    const varErrors = [];
    if (!data.hasOwnProperty('oid')) {
        varErrors.push('oid')
    };

    if (!data.hasOwnProperty('name')) {
        varErrors.push('name')
    };

    if (!data.hasOwnProperty('start_time')) {
        varErrors.push('start_time')
    };

    if (!data.hasOwnProperty('end_time')) {
        varErrors.push('end_time')
    };
    return varErrors.length <= 0 ? 
    {
        success: true,
        message: null
    }
    :
    {
        success: false,
        message: `Missing parameters: ${varErrors.join(', ')}`
    }
};

export async function getAllAuctions() {
    const data = await retrieveAllAuctions();
    if (!data) throw new Error('Auctions not found');
    return data;
};

export async function setAuction(param) {
    const validateParameter = await validateParam(param);
    if (!validateParameter.success) throw new Error(validateParameter.message);
    const auction = new Auction(param);
    const data = await insertAuction(auction);
    if (!data) throw new Error('Auction not inserted');
    return data;
};

/* All AID Methods */
export async function getAuctionById(id) {
    const data = await retrieveAuctionById(id);
    if (!data) throw new Error('Auction does not exists');
    return data;
};

export async function updateAuctionById(param,id) {
    const validateParameter = await validateParam(param);
    if (!validateParameter.success) throw new Error(validateParameter.message);
    const auction = new Auction(param);
    const data = await upAuctionById(auction, id);
    if (!data) throw new Error('Auction is not updated');
    return data;
};

export async function deleteAuctionById(id, oid) {
    const result = await delAuctionById(id, oid);
    const data = await retrieveAuctionById(id);
    if (data !== null) throw new Error('Auction is not deleted');
    return true;
};