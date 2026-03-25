import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 2,
    },
    contentPlaying: {
        padding: 0,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
    },
    errorContainer: {
        backgroundColor: 'rgba(70, 11, 0, 0.76)',
        padding: 40,
        borderRadius: 34,
        borderWidth: 5,
        borderColor: '#D89A2E',
        alignItems: 'center',
        maxWidth: 400,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 22,
        elevation: 10,
    },
    errorTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FDE047',
        marginBottom: 20,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    errorText: {
        fontSize: 18,
        color: '#F6DEB2',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#DEB887',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
