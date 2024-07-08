"use strict";
const fs = require("fs");
const pg = require("pg");
const axios = require("axios");

const config = {
    connectionString: "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(`${process.env.HOME}/.postgresql/root.crt`).toString(),
    },
};

const client = new pg.Client(config);

async function fetchCharacters() {
    let characters = [];
    let nextUrl = 'https://rickandmortyapi.com/api/character';

    while (nextUrl) {
        const response = await axios.get(nextUrl);
        characters = characters.concat(response.data.results);
        nextUrl = response.data.info.next;
    }

    return characters;
}

async function setupDatabase() {
    await client.connect();

    await client.query(`
        CREATE TABLE IF NOT EXISTS medet (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            status VARCHAR(50),
            species VARCHAR(50),
            type VARCHAR(50),
            gender VARCHAR(50),
            origin_name VARCHAR(100),
            location_name VARCHAR(100),
            image VARCHAR(255),
            url VARCHAR(255),
            created TIMESTAMP
        )
    `);
}

async function insertCharacters(characters) {
    const insertQuery = `
        INSERT INTO medet (name, status, species, type, gender, origin_name, location_name, image, url, created)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    for (const character of characters) {
        await client.query(insertQuery, [
            character.name,
            character.status,
            character.species,
            character.type || "",
            character.gender,
            character.origin.name,
            character.location.name,
            character.image,
            character.url,
            character.created
        ]);
    }
}

async function main() {
    try {
        await setupDatabase();
        const characters = await fetchCharacters();
        await insertCharacters(characters);
        console.log("Characters have been successfully inserted into the database.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
