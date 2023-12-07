- Set a static hostname in the docker invocation.
- Set `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, and the repository credentials.
- Volumes:
  - `/data` for the data to be backed up.
  - `/cache` for the Restic cache.

Example environment file:

```
RESTIC_REPOSITORY=s3:...
RESTIC_PASSWORD=abcd
AWS_ACCESS_KEY_ID=0123
AWS_SECRET_ACCESS_KEY=wxyz
```

Example docker invocation:

```sh
docker run --rm \
  --hostname my-hostname \
  --env-file restic.env \
  -v /path/to/restic-cache:/cache:z \
  -v /path/to/minecraft-data:/data:z \
  papermc-taijotain-restic-backup:local \
  papermc-taijotain-restic backup --- forget --- prune --- check
```
