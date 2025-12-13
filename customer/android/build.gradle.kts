allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir = File("C:/Users/karth/.silver_taxi_build/customer")
rootProject.buildDir = newBuildDir

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
