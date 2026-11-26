# Java and Kotlin

Depth for the `test` skill in a project with a `pom.xml`, a `build.gradle` or a `build.gradle.kts`.

## Find the checks

1. A `pom.xml` is Maven. A `build.gradle` or a `build.gradle.kts` is Gradle. Use the wrapper of the repo, `./mvnw` or `./gradlew`, when it is there.
2. In Gradle, the checks are the tasks of the plugins in the build file: `checkstyle`, `pmd`, `com.github.spotbugs`, `com.diffplug.spotless`, `io.gitlab.arturbosch.detekt`, `org.jlleitschuh.gradle.ktlint`. `./gradlew tasks --all` lists the tasks.
3. In Maven, the checks are the plugins under `<build>` in the `pom.xml`: `maven-checkstyle-plugin`, `spotless-maven-plugin`, `spotbugs-maven-plugin`. `maven-surefire-plugin` runs the unit tests, and `maven-failsafe-plugin` the integration tests, the classes named `*IT`.
4. `./gradlew check` and `./mvnw verify` join every check. Run the parts by name, one row each.
5. A project with several modules is checked from the root. For one module it is `./gradlew :<module>:test`, or `./mvnw -pl <module> -am test`.
6. End-to-end tests are the Failsafe tests of Maven, and Gradle tasks like `integrationTest` or `e2eTest`. `verify` and `check` may run them: one more reason to run the parts by name.
7. An Android project names its tasks by build variant. `./gradlew tasks --all` lists them.

## Run the checks

| Check      | Gradle                                        | Maven                        |
| ---------- | --------------------------------------------- | ---------------------------- |
| Format     | `./gradlew spotlessCheck`                     | `./mvnw -B spotless:check`   |
| Lint       | `./gradlew checkstyleMain checkstyleTest`     | `./mvnw -B checkstyle:check` |
| Lint       | `./gradlew detekt` or `./gradlew ktlintCheck` | A goal of the plugin         |
| Type check | `./gradlew testClasses`                       | `./mvnw -B test-compile`     |
| Tests      | `./gradlew test`                              | `./mvnw -B test`             |

1. A row is there only when its plugin is in the build file. The type check and the tests are always there.
2. `--console=plain` on Gradle and `-B` on Maven keep progress bars out of the output.
3. `--continue` on Gradle and `--fail-at-end` on Maven go on after a task or a module that fails. Without them, the rest does not run.
4. The console names the failing tests and leaves out their output. Read it from the report files: `build/test-results/test/*.xml` in Gradle, `target/surefire-reports/*.txt` in Maven, once per module. That text goes in the report.
5. `UP-TO-DATE` or `FROM-CACHE` next to a Gradle task means that its inputs did not change since the last run. That result holds. It is `pass`.
6. A first run downloads the build tool and every dependency. `--offline` on Gradle and `-o` on Maven stop that. A run that then fails for a missing download is `not run`.

## Start the app

1. Spring Boot: `./gradlew bootRun` or `./mvnw spring-boot:run`, on port 8080, or on `server.port` of `application.properties` or `application.yml`. It is up at `Started <name> in <n> seconds`.
2. Quarkus: `./gradlew quarkusDev` or `./mvnw quarkus:dev`, on port 8080. A project with the `application` plugin of Gradle: `./gradlew run`.
3. A profile, like `dev` or `local`, is set only the way the docs say.
4. The start task never ends. Gradle stays at a line like `80% EXECUTING` while the app is up. That is not a hang.
5. Spring Boot and Quarkus can start containers by themselves for the services the app needs. What they started is a line in the notes.
6. With Gradle, the app is a child of the Gradle daemon, not of `./gradlew`. After the stop, ask the port. When it still answers, find the process that holds it, see that its command is the app you started, and stop that one.
7. The Gradle daemon stays up after a run. That is its normal state. It is not a process to stop.

## Traps

1. `spotlessApply`, `ktlintFormat`, `spotless:apply`, or `detekt --auto-correct`. They rewrite files.
2. `./gradlew check` or `./mvnw verify` as one row. They stop at the first failure, and may run the end-to-end tests.
3. The console output of a failed test run as the whole output. The failure text is in the report files.
4. A global `gradle` or `mvn` when the repo has a wrapper. It may be another version.
5. `./gradlew build` or `./mvnw package` as the check. They also pack files nobody asked for.
6. `clean` in front of a check to be sure. It deletes the build output a running app uses.
7. `--tests` or `-Dtest=` to make the run shorter. The whole suite runs.
