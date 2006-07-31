#!/usr/bin/env python

import sys, string, re, os, random, pickle, cPickle
import config, tokenizer, treegenerator




def extractFileContentId(data):
  for item in config.QXHEAD["uniqueId"].findall(data):
    return item

  for item in config.QXHEAD["defineClass"].findall(data):
    return item[0]

  return None


def extractSuperClass(data):
  for item in config.QXHEAD["defineClass"].findall(data):
    return item[2]

  return None


def extractLoadtimeDeps(data, fileId=""):
  deps = []

  # Storing inheritance deps
  superClass = extractSuperClass(data)
  if superClass != None and superClass != "" and not superClass in config.JSBUILTIN:
    deps.append(superClass)

  # Adding explicit requirements
  for item in config.QXHEAD["require"].findall(data):
    if item == fileId:
      print "      - Self-referring load dependency: %s" % item
    elif item in deps:
      print "      - Double definition of load dependency: %s" % item
    else:
      deps.append(item)

  return deps


def extractRuntimeDeps(data, fileId=""):
  deps = []

  # Adding explicit requirements
  for item in config.QXHEAD["use"].findall(data):
    if item == fileId:
      print "      - Self-referring runtime dependency: %s" % item
    elif item in deps:
      print "      - Double definition of runtime dependency: %s" % item
    else:
      deps.append(item)

  return deps


def extractOptionalDeps(data):
  deps = []

  # Adding explicit requirements
  for item in config.QXHEAD["optional"].findall(data):
    if not item in deps:
      deps.append(item)

  return deps


def extractModules(data):
  mods = []

  for item in config.QXHEAD["module"].findall(data):
    if not item in mods:
      mods.append(item)

  return mods


def extractResources(data):
  res = []

  for item in config.QXHEAD["resource"].findall(data):
    res.append(item)

  return res










def indexFile(filePath, filePathId, scriptInput, listIndex, sourceScriptPath, resourceInput, resourceOutput, options, fileDb={}, moduleDb={}):
  print "    - %s" % filePathId,

  # Modification time
  fileModTime = os.stat(filePath).st_mtime
  cacheModTime = 0

  if options.cacheDirectory:
    fileCacheName = os.path.join(options.cacheDirectory, filePathId + ".cache")

    try:
      cacheModTime = os.stat(fileCacheName).st_mtime
    except OSError:
      cacheModTime = 0

  # If we must read the file again
  if fileModTime <= cacheModTime:

    # We hope the ID is valid (saves one file read!)
    fileId = filePathId

    # Use Cache
    try:
      fileDb[fileId] = cPickle.load(open(fileCacheName))

    except EOFError or PickleError or UnpicklingError:
      cacheModTime = 0
      print "      - Error while reading! Ignore cache"

  if fileModTime > cacheModTime:
    print "=> parse..."

    useCache = True

    # Read file content and extract ID from content definition
    fileContent = file(filePath, "r").read()
    fileContentId = extractFileContentId(fileContent)

    # Search for valid ID
    if fileContentId == None:
      fileId = filePathId
      print "    * Could not extract ID from file: %s. Using fileName!" % fileId
      useCache = False

    else:
      fileId = fileContentId

      if fileContentId != filePathId:
        print "    * ID mismatch: CONTENT=%s != PATH=%s" % (fileContentId, filePathId)
        useCache = False

    # Structuring
    tokens = tokenizer.parseStream(fileContent, fileId)
    tree = treegenerator.createSyntaxTree(tokens)

    # Store file data
    fileDb[fileId] = {
      "tokens" : tokens,
      "tree" : tree,
      "optionalDeps" : extractOptionalDeps(fileContent),
      "loadDeps" : extractLoadtimeDeps(fileContent, fileId),
      "runtimeDeps" : extractRuntimeDeps(fileContent, fileId),
      "resources" : extractResources(fileContent),
      "modules" : extractModules(fileContent)
    }

    if useCache:
      try:
        cPickle.dump(fileDb[fileId], open(fileCacheName,'w'), 2)

      except EOFError or PickleError or PicklingError:
        print "      - Could not store cache file!"

  else:
    print "=> cached"

  # Register file to module data
  for moduleId in fileDb[fileId]["modules"]:
    if moduleDb.has_key(moduleId):
      moduleDb[moduleId].append(fileId)
    else:
      moduleDb[moduleId] = [ fileId ]

  # Store additional data (non-cached data)
  fileDb[fileId]["scriptInput"] = scriptInput
  fileDb[fileId]["modificationTime"] = fileModTime
  fileDb[fileId]["path"] = filePath
  fileDb[fileId]["resourceInput"] = resourceInput
  fileDb[fileId]["resourceOutput"] = resourceOutput
  fileDb[fileId]["sourceScriptPath"] = sourceScriptPath
  fileDb[fileId]["listIndex"] = listIndex


def indexSingleScriptInput(scriptInput, listIndex, options, fileDb={}, moduleDb={}):
  # Search for other indexed lists
  if len(options.sourceScriptPath) > listIndex:
    sourceScriptPath = options.sourceScriptPath[listIndex]
  else:
    sourceScriptPath = None

  if len(options.resourceInput) > listIndex:
    resourceInput = options.resourceInput[listIndex]
  else:
    resourceInput = None

  if len(options.resourceOutput) > listIndex:
    resourceOutput = options.resourceOutput[listIndex]
  else:
    resourceOutput = None

  for root, dirs, files in os.walk(scriptInput):

    # Filter ignored directories
    for ignoredDir in config.DIRIGNORE:
      if ignoredDir in dirs:
        dirs.remove(ignoredDir)

    # Searching for files
    for fileName in files:
      if os.path.splitext(fileName)[1] == config.JSEXT:
        filePath = os.path.join(root, fileName)
        filePathId = os.path.join(root.replace(scriptInput + os.sep, ""), fileName.replace(config.JSEXT, "")).replace(os.sep, ".")

        indexFile(filePath, filePathId, scriptInput, listIndex, sourceScriptPath, resourceInput, resourceOutput, options, fileDb, moduleDb)


def indexScriptInput(options):
  fileDb = {}
  moduleDb = {}
  listIndex = 0

  for scriptInput in options.scriptInput:
    indexSingleScriptInput(scriptInput, listIndex, options, fileDb, moduleDb)
    listIndex += 1

  return fileDb, moduleDb









def addFileToSortedList(sortedList, fileDb, moduleDb, fileId, enableDeps):
  if not fileDb.has_key(fileId):
    print "    * Error: Couldn't find required file: %s" % fileId
    return False

  # Test if already in
  try:
    sortedList.index(fileId)

  except ValueError:
    # Including load dependencies
    if enableDeps:
      for loadDepId in fileDb[fileId]["loadDeps"]:
        addFileToSortedList(sortedList, fileDb, moduleDb, loadDepId, True)

    # Add myself
    try:
      sortedList.index(fileId)
    except ValueError:
      sortedList.append(fileId)

    # Include runtime dependencies
    if enableDeps:
      for runtimeDepId in fileDb[fileId]["runtimeDeps"]:
        addFileToSortedList(sortedList, fileDb, moduleDb, runtimeDepId, True)


def getSortedList(options, fileDb, moduleDb):
  includeIds = []
  excludeIds = []

  sortedIncludeList = []
  sortedExcludeList = []



  # INCLUDE

  # Add Modules and Files
  if options.include:
    for include in options.include:
      if include in moduleDb:
        includeIds.extend(moduleDb[include])

      else:
        includeIds.append(include)

  # Add all if empty
  if len(includeIds) == 0:
    for fileId in fileDb:
      includeIds.append(fileId)

  # Sorting
  for fileId in includeIds:
    addFileToSortedList(sortedIncludeList, fileDb, moduleDb, fileId, options.enableIncludeDependencies)



  # EXCLUDE

  # Add Modules and Files
  if options.exclude:
    for exclude in options.exclude:
      if exclude in moduleDb:
        excludeIds.extend(moduleDb[exclude])

      else:
        excludeIds.append(exclude)

    # Sorting
    for fileId in excludeIds:
      addFileToSortedList(sortedExcludeList, fileDb, moduleDb, fileId, options.enableExcludeDependencies)




  # MERGE

  # Remove excluded files from included files list
  for fileId in sortedExcludeList:
    if fileId in sortedIncludeList:
      sortedIncludeList.remove(fileId)



  # RETURN

  return sortedIncludeList
