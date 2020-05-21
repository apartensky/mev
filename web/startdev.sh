BASEDIR=`readlink -f $(dirname "$0")`
TARGETDIR=$BASEDIR/target/classes/edu/dfci/cccb/mev/web
echo "TARGET:"$TARGETDIR
SRCDIR=$BASEDIR/src/main/javascript/edu/dfci/cccb/mev/web
echo "SOURCE:"$SRCDIR

while read -r line; do
    echo $line
    if [[ $line = *"Started Jetty Server"* ]]; then
 
	find $TARGETDIR -maxdepth 1 -type d -name ui -exec rm -rf "{}" \;
	find $TARGETDIR -maxdepth 1 -type l -name ui -exec rm "{}" \; 

	find $TARGETDIR -maxdepth 1 -type d -name libs -exec rm -rf "{}" \;
        find $TARGETDIR -maxdepth 1 -type l -name libs -delete       

       	find $TARGETDIR -maxdepth 1 -type d -name javascript -exec rm -rf "{}" \;
	find $TARGETDIR -maxdepth 1 -type l -name javascript -exec rm "{}" \; 
 
      	find $TARGETDIR -maxdepth 1 -type d -name vendor -exec rm -rf "{}" \;
	find $TARGETDIR -maxdepth 1 -type l -name vendor -exec rm "{}" \; 

       	find $TARGETDIR -maxdepth 1 -type d -name mock -exec rm -rf "{}" \;
	find $TARGETDIR -maxdepth 1 -type l -name mock -exec rm "{}" \; 
 
        echo "Linking source folders"
        ln -sL $SRCDIR/ui $TARGETDIR
        ln -sL $SRCDIR/libs $TARGETDIR
        ln -sL $SRCDIR/javascript $TARGETDIR
        ln -sL $SRCDIR/vendor $TARGETDIR
        ln -sL $SRCDIR/mock $TARGETDIR
    fi
done < <(mvn clean jetty:run -Plocal,live)
echo "**** DONE ****"
