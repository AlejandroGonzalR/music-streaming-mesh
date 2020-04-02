# Music Streaming Mesh

This project implements an distributed topology of a music streaming and sharing service, implementing the PoET consensus algorithm to allow or deny uploads in the shared tracklist.

## Getting Started

First, set an environment variables to select the leader of the mesh and the MongoDB URI ($LEADER, $DB_ROOT_URI), please review the docker compose file, after that run the following command:

```
docker-compose up --build
```

This will recreate three containers available in ports 10000 to 10002, each instance with a web client, where you can upload and listen the tracks.

## Built With

* [Node.js 12.16.1 LTS](https://maven.apache.org/) - Runtime environment
* See also the used [packages](https://github.com/AlejandroGonzalR/berkeley-algorithm/blob/master/package.json) for more details

## Authors

* **Alejandro González Rodríguez** - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
