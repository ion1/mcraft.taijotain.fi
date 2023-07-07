VERSION 0.6

IMPORT ./download-files AS dl

ARG MINECRAFT_VERSION=1.20.1
# modrinth:gu1LvcZ0 https://modrinth.com/plugin/gravitycontrol
# modrinth:Lu3KuzdV https://modrinth.com/plugin/coreprotect
# modrinth:MubyTbnA https://modrinth.com/plugin/freedomchat
# modrinth:UmLGoGij https://modrinth.com/plugin/discordsrv
# modrinth:UO7aDcrF https://modrinth.com/plugin/modmapcompanion
# modrinth:VPo0otUH https://modrinth.com/plugin/motdgg
# spiget:6245 https://www.spigotmc.org/resources/placeholderapi.6245/
# spiget:28140 https://www.spigotmc.org/resources/luckperms.28140/
# spiget:57242 https://www.spigotmc.org/resources/spark.57242/
# spiget:59773 https://www.spigotmc.org/resources/chestsort-api.59773/
# spiget:83557 https://www.spigotmc.org/resources/bluemap.83557/
# github:Jikoo/OpenInv https://github.com/jikoo/OpenInv
# github:TechnicJelle/BlueMapOfflinePlayerMarkers https://github.com/TechnicJelle/BlueMapOfflinePlayerMarkers
ARG PLUGINS="modrinth:gu1LvcZ0 modrinth:Lu3KuzdV modrinth:MubyTbnA modrinth:UmLGoGij modrinth:UO7aDcrF modrinth:VPo0otUH spiget:6245 spiget:28140 spiget:57242 spiget:59773 spiget:83557 github:Jikoo/OpenInv github:TechnicJelle/BlueMapOfflinePlayerMarkers"
ARG PLUGIN_CONFIG_DIRS="BlueMap BlueMapOfflinePlayerMarkers ChestSort CoreProtect DiscordSRV FreedomChat GravityControl LuckPerms MapModCompanion OpenInv PlaceholderAPI spark"

paper:
  FROM +jre
  ENV PATH="/minecraft-root/bin:$PATH"
  # Used by start-server
  ENV PLUGIN_CONFIG_DIRS="$PLUGIN_CONFIG_DIRS"
  ENV MEMORY=""

  # Copy in multiple layers to reduce update deltas. Roughly ordered according
  # to an estimate of the frequency of change and/or descending size.

  # 46 MB, changes very rarely
  COPY +paper-root/minecraft-root/server/ /minecraft-root/server/

  # 9 MB, changes rarely
  COPY +paper-root/minecraft-root/bin/mc-monitor /minecraft-root/bin/
  # 5 MB, changes rarely
  COPY +paper-root/minecraft-root/bin/rcon-cli /minecraft-root/bin/
  # 3 MB, changes rarely
  COPY +paper-root/minecraft-root/bin/mc-server-runner /minecraft-root/bin/

  # 10 MB, changes rarely
  COPY +paper-root/minecraft-root/plugins/DiscordSRV*.jar /minecraft-root/plugins/
  # 4 MB, changes rarely
  COPY +paper-root/minecraft-root/plugins/spark*.jar /minecraft-root/plugins/
  # 1 MB, changes rarely
  COPY +paper-root/minecraft-root/plugins/PlaceholderAPI*.jar /minecraft-root/plugins/

  # 38 MB, changes frequently
  COPY +paper-root/minecraft-root/paper/ /minecraft-root/paper/

  # 30 MB, changes somewhat frequently
  COPY +paper-root/minecraft-root/mc-anti-malware/ /minecraft-root/mc-anti-malware/

  # < 1 MB, changes every now and then
  COPY +paper-root/minecraft-root/plugins/ChestSort*.jar /minecraft-root/plugins/
  # 5 MB, changes every now and then
  COPY +paper-root/minecraft-root/plugins/BlueMap*.jar /minecraft-root/plugins/
  # 2 MB, changes somewhat frequently
  COPY +paper-root/minecraft-root/plugins/LuckPerms*.jar /minecraft-root/plugins/

  # Remaining tiny mods, small scripts and symlinks, < 1 MB
  COPY +paper-root/minecraft-root/ /minecraft-root/

  USER minecraft

  RUN \
    set -eu; \
    mkdir data server server/cache; \
    ( \
      cd server/cache; \
      for f in ../../../minecraft-root/server/cache/*; do \
        ln -sv "$f" .; \
      done; \
    ); \
    ( \
      cd server; \
      for f in \
        banned-ips.json banned-players.json help.yml ops.json permissions.yml \
        version_history.json whitelist.json; \
      do \
        ln -sv ../data/"$f" .; \
      done \
    )
  WORKDIR server

  VOLUME /minecraft/data
  EXPOSE 25565 25565/udp 8100
  ENTRYPOINT ["start-server"]
  HEALTHCHECK --start-period=1m CMD health-check

  SAVE IMAGE papermc-taijotain:local

paper-root:
  FROM +jre
  COPY +log4jscanner/log4jscanner /

  # These files will be copied to /minecraft-root as root in +paper.
  USER minecraft

  COPY \
    (dl+download-files/paper/ \
      --MINECRAFT_VERSION="$MINECRAFT_VERSION" \
      --PLUGINS="$PLUGINS") \
    paper/

  # Run log4jscanner once before running paper.jar which downloads mojang...jar
  RUN /log4jscanner --verbose --rewrite /minecraft

  # Download the Minecraft jar. The libraries and versions directories will be
  # recreated in runtime based on the cached jar.
  RUN \
    (cd paper && ln -s paper-*.jar paper.jar) && \
    mkdir server && \
    cd server && \
    java -jar ../paper/paper.jar -v && \
    rm -fr libraries versions

  COPY \
    ( \
      dl+download-files/mc-anti-malware/ \
        --MINECRAFT_VERSION="$MINECRAFT_VERSION" \
        --PLUGINS="$PLUGINS" \
    ) \
    mc-anti-malware/

  COPY \
    ( \
      dl+download-files/plugins/ \
        --MINECRAFT_VERSION="$MINECRAFT_VERSION" \
        --PLUGINS="$PLUGINS" \
    ) \
    plugins/

  # Run log4jscanner again after the rest of the files have been added.
  RUN /log4jscanner --verbose --rewrite /minecraft

  # Run MCAntiMalware in single scan mode. Ignore false positives.
  RUN \
    java -jar mc-anti-malware/MCAntiMalware.jar \
      --printNotInfectedMessages true --scanDirectory plugins --singleScan true && \
    sed -i -r \
      -e '/\[DETECTED\]: plugins\/CoreProtect-[^ ]+\.jar MIGHT be infected with Spigot.MALWARE.McMonetary.A Class Path: net\/coreprotect\/listener\/entity\/EntityDeathListener ; SourceFile\/Line EntityDeathListener.java\/-?1|[0-9]+$/d' \
      -e '/\[DETECTED\]: plugins\/DiscordSRV-Build-[^ ]+\.jar MIGHT be infected with Spigot.MALWARE.SystemAccess.Exec Class Path: (github\/scarsz\/discordsrv\/dependencies\/minidns\/dnsserverlookup\/AndroidUsingExec)? ; SourceFile\/Line AndroidUsingExec.java\/34/d' \
      AntiMalware/logs/latest.log && \
    ! grep -F '[DETECTED]' AntiMalware/logs/latest.log && \
    rm -fr AntiMalware

  # Plugins want to write their config to the the plugin directory. Deal with it.
  RUN \
    set -eu; \
    for d in $PLUGIN_CONFIG_DIRS; do \
      ln -s ../../minecraft/data/plugins/"$d" plugins/"$d"; \
    done

  COPY +itzg/mc-server-runner bin/
  COPY +itzg/mc-monitor bin/
  COPY +itzg/rcon-cli bin/

  COPY files/start-server bin/
  COPY files/health-check bin/
  COPY files/rcon bin/
  COPY files/log4j2.xml ./

  SAVE ARTIFACT /minecraft /minecraft-root

jre:
  FROM eclipse-temurin:19-jre-alpine
  WORKDIR /minecraft
  RUN \
    addgroup -g 25565 -S minecraft && \
    adduser -u 25565 -h /minecraft -G minecraft -S minecraft && \
    chown -R minecraft:minecraft /minecraft

itzg:
  FROM itzg/minecraft-server:latest
  SAVE ARTIFACT /usr/local/bin/mc-server-runner
  SAVE ARTIFACT /usr/local/bin/mc-monitor
  SAVE ARTIFACT /usr/local/bin/rcon-cli

log4jscanner:
  FROM dl+alpine
  RUN apk add --no-cache curl jq
  USER minecraft
  RUN \
    set -eu; \
    url=; \
    cmd=$( \
      curl -s https://api.github.com/repos/google/log4jscanner/releases/latest | \
      jq -r '.assets[] | select(.name | endswith("-linux-amd64.tar.gz")) | "url=\(.browser_download_url | @sh)"' \
    ); \
    printf '%s\n' "$cmd"; \
    eval "$cmd"; \
    curl -L "$url" | tar zxv
  SAVE ARTIFACT log4jscanner/log4jscanner
