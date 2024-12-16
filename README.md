> [!NOTE]
> disbuilds is heavily a work in progress and has incomplete information. help is greatly appreciated!

<p align="center">
<img align="center" src="./ninohusk.webp" width="50px"  />
</p>
<h3 align="center">the discord build archive</h3>

<hr/>

disbuilds is a project that fetches and manages discord build information for different platforms (windows, macos, and linux currently). it provides a web interface to view and interact with this data.

### production instance

https://disbuilds.cute.fm until i can secure a domain

### features

#### work in progress

- [x] fetch and store discord versions
- [x] display discord versions on the web interface

#### planned

- [ ] support for web
- [ ] support for development
- [ ] support for ios
- [ ] support for android
- [ ] support for marketing
- [ ] support for logging 3rd party client builds

### prerequisites

- node.js (v22 or later recommended)
- mongodb

### setup

1. clone the repository:
   ```
   git clone https://github.com/ryawaa/disbuilds.git
   cd disbuilds
   ```

2. install dependencies:
   ```
   npm install
   ```

3. create a `.env` file in the root directory and add your mongodb connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. set up the mongodb database:
   ```
   npm run setup
   ```

5. populate the database with discord versions (or not):
   ```
   npm run populate
   ```

> [!NOTE]
> the schema is in populate.ts i should probably fix that

### usage

1. start the development server:
   ```
   npm run dev
   ```

2. open your browser and navigate to `http://localhost:3000`

### scripts

- `setup.ts`: sets up the mongodb collections and indexes
- `populate.ts`: fetches the latest discord versions and populates the database
- `nuke.ts`: drops all collections in the database (use with caution)

### api endpoints

- `/api/latest`: get the latest discord versions for all platforms
- `/api/builds`: get a list of discord builds

### credits

- nino for ninohusk

### contributing

contributions are welcome! please feel free to submit a pull request, or contact me in discord at (ryawaa) if you have information about old discord builds!

### license

this project is licensed under the agplv3 license.
